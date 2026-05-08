/**
 * scripts/__tests__/detect-slug-mutations.test.ts
 *
 * F3.3 — testa detecção de rename/delete de slugs e emissão de eventos.
 * Não faz chamadas git reais — testa as funções de forma isolada usando tmpdir.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readInvalidationLog } from '../../src/lib/blog/invalidation-log'
import {
  findPackagesReferencingSlug,
  emitSlugMutationEvents,
} from '../detect-slug-mutations'
import type { SlugMutation } from '../detect-slug-mutations'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slug-mut-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

const VALID_ISO = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const VALID_SHA256 = 'a'.repeat(64)

function writePackageWithLinks(
  stockpileDir: string,
  uuid: string,
  locales: string[],
  reviewedContent: string,
  promotionState = 'available',
): void {
  const pkgDir = path.join(stockpileDir, 'packages', uuid)
  fs.mkdirSync(pkgDir, { recursive: true })

  for (const locale of locales) {
    const localeDir = path.join(pkgDir, locale)
    fs.mkdirSync(localeDir, { recursive: true })
    fs.writeFileSync(path.join(localeDir, 'reviewed.md'), reviewedContent)
  }

  const pkg = {
    equivalence_id: uuid,
    stockpile_version: 1,
    type: 'exclusive',
    locales_present: locales,
    primary_locale: locales[0],
    volatility_class: 'vendor',
    freshness_policy: {
      max_age_days: 21,
      rewrite_required_above_days: 0,
      freshness_gate_signals: [],
    },
    scores: Object.fromEntries(locales.map(l => [l, { seo: 82, conversion: 71, quality_gate: 85 }])),
    brief_fingerprint: { cluster_id: 'test', primary_keywords: ['test'], intent: 'comercial', hash_sha256: VALID_SHA256 },
    lifecycle: { created_at: VALID_ISO, quality_gated_at: VALID_ISO, freshness_checked_at: null, promoted_at: null, promoted_in_commit: null },
    promotion_state: promotionState,
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }

  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2))
}

// ---------------------------------------------------------------------------
// findPackagesReferencingSlug
// ---------------------------------------------------------------------------

describe('findPackagesReferencingSlug', () => {
  it('finds package that has markdown link to slug', () => {
    const uuid = randomUUID()
    const content = `---\ntitle: Test\n---\n\nVeja também [artigo](/blog/target-slug) para mais.\n`
    const stockpileDir = path.join(tmpDir, 'stockpile')
    writePackageWithLinks(stockpileDir, uuid, ['pt-BR'], content)

    const result = findPackagesReferencingSlug('target-slug', stockpileDir)
    expect(result).toContain(uuid)
  })

  it('ignores packages with promoted state', () => {
    const uuid = randomUUID()
    const content = `---\ntitle: Test\n---\n\nLink: [artigo](/blog/my-slug)\n`
    const stockpileDir = path.join(tmpDir, 'stockpile')
    writePackageWithLinks(stockpileDir, uuid, ['pt-BR'], content, 'promoted')

    const result = findPackagesReferencingSlug('my-slug', stockpileDir)
    expect(result).not.toContain(uuid)
  })

  it('ignores packages that do not reference the slug', () => {
    const uuid = randomUUID()
    const content = `---\ntitle: Test\n---\n\nLink: [artigo](/blog/other-slug)\n`
    const stockpileDir = path.join(tmpDir, 'stockpile')
    writePackageWithLinks(stockpileDir, uuid, ['pt-BR'], content)

    const result = findPackagesReferencingSlug('target-slug', stockpileDir)
    expect(result).not.toContain(uuid)
  })

  it('returns empty array when packages dir does not exist', () => {
    const stockpileDir = path.join(tmpDir, 'nonexistent')
    const result = findPackagesReferencingSlug('any-slug', stockpileDir)
    expect(result).toEqual([])
  })

  it('finds locked packages (also active)', () => {
    const uuid = randomUUID()
    const content = `[link](/blog/locked-slug)`
    const stockpileDir = path.join(tmpDir, 'stockpile')
    writePackageWithLinks(stockpileDir, uuid, ['en'], content, 'locked')

    const result = findPackagesReferencingSlug('locked-slug', stockpileDir)
    expect(result).toContain(uuid)
  })
})

// ---------------------------------------------------------------------------
// emitSlugMutationEvents — renamed
// ---------------------------------------------------------------------------

describe('emitSlugMutationEvents — slug_renamed', () => {
  it('emits one invalidated event for a rename with no packages affected', () => {
    const mutation: SlugMutation = {
      type: 'renamed',
      locale: 'pt-BR',
      oldSlug: 'foo',
      newSlug: 'bar',
      oldPath: 'content/pt-BR/blog/foo.mdx',
      newPath: 'content/pt-BR/blog/bar.mdx',
    }

    const stockpileDir = path.join(tmpDir, 'stockpile')
    fs.mkdirSync(path.join(stockpileDir, 'packages'), { recursive: true })

    const { eventsEmitted, packagesInvalidated } = emitSlugMutationEvents([mutation], stockpileDir)

    expect(eventsEmitted).toBe(1)
    expect(packagesInvalidated).toBe(0)

    const events = readInvalidationLog(stockpileDir)
    expect(events).toHaveLength(1)
    expect(events[0]!.reason).toContain('slug_renamed')
    expect(events[0]!.reason).toContain('foo')
    expect(events[0]!.reason).toContain('bar')
    expect(events[0]!.triggered_by).toBe('detect-slug-mutations')
    expect(events[0]!.affected_locales).toContain('pt-BR')
  })

  it('emits extra events for packages referencing the old slug', () => {
    const stockpileDir = path.join(tmpDir, 'stockpile')
    const uuid = randomUUID()
    writePackageWithLinks(stockpileDir, uuid, ['pt-BR'], `[link](/blog/old-slug)`)

    const mutation: SlugMutation = {
      type: 'renamed',
      locale: 'pt-BR',
      oldSlug: 'old-slug',
      newSlug: 'new-slug',
      oldPath: 'content/pt-BR/blog/old-slug.mdx',
      newPath: 'content/pt-BR/blog/new-slug.mdx',
    }

    const { eventsEmitted, packagesInvalidated } = emitSlugMutationEvents([mutation], stockpileDir)

    // 1 primary + 1 package invalidation
    expect(eventsEmitted).toBe(2)
    expect(packagesInvalidated).toBe(1)

    const events = readInvalidationLog(stockpileDir)
    const pkgEvent = events.find(e => e.equivalence_id === uuid)
    expect(pkgEvent).toBeDefined()
    expect(pkgEvent!.reason).toContain('slug_renamed')
    expect(pkgEvent!.reason).toContain('old-slug')
  })
})

// ---------------------------------------------------------------------------
// emitSlugMutationEvents — deleted
// ---------------------------------------------------------------------------

describe('emitSlugMutationEvents — slug_deleted', () => {
  it('emits one invalidated event for a delete with no packages affected', () => {
    const mutation: SlugMutation = {
      type: 'deleted',
      locale: 'en',
      oldSlug: 'removed-article',
      oldPath: 'content/en/blog/removed-article.mdx',
    }

    const stockpileDir = path.join(tmpDir, 'stockpile')
    fs.mkdirSync(path.join(stockpileDir, 'packages'), { recursive: true })

    const { eventsEmitted, packagesInvalidated } = emitSlugMutationEvents([mutation], stockpileDir)

    expect(eventsEmitted).toBe(1)
    expect(packagesInvalidated).toBe(0)

    const events = readInvalidationLog(stockpileDir)
    expect(events[0]!.reason).toContain('slug_deleted')
    expect(events[0]!.reason).toContain('removed-article')
    expect(events[0]!.affected_locales).toContain('en')
  })

  it('invalidates packages referencing deleted slug', () => {
    const stockpileDir = path.join(tmpDir, 'stockpile')
    const uuid = randomUUID()
    writePackageWithLinks(stockpileDir, uuid, ['en', 'pt-BR'], `Check [this](/blog/deleted-slug) out.`)

    const mutation: SlugMutation = {
      type: 'deleted',
      locale: 'en',
      oldSlug: 'deleted-slug',
      oldPath: 'content/en/blog/deleted-slug.mdx',
    }

    const { eventsEmitted, packagesInvalidated } = emitSlugMutationEvents([mutation], stockpileDir)
    expect(packagesInvalidated).toBe(1)
    expect(eventsEmitted).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Multiple mutations in one run
// ---------------------------------------------------------------------------

describe('multiple mutations', () => {
  it('handles rename + delete together', () => {
    const stockpileDir = path.join(tmpDir, 'stockpile')
    fs.mkdirSync(path.join(stockpileDir, 'packages'), { recursive: true })

    const mutations: SlugMutation[] = [
      { type: 'renamed', locale: 'pt-BR', oldSlug: 'a', newSlug: 'b', oldPath: 'content/pt-BR/blog/a.mdx', newPath: 'content/pt-BR/blog/b.mdx' },
      { type: 'deleted', locale: 'en', oldSlug: 'c', oldPath: 'content/en/blog/c.mdx' },
    ]

    const { eventsEmitted } = emitSlugMutationEvents(mutations, stockpileDir)
    expect(eventsEmitted).toBe(2)

    const events = readInvalidationLog(stockpileDir)
    expect(events).toHaveLength(2)
  })
})
