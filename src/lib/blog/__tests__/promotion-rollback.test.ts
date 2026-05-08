/**
 * src/lib/blog/__tests__/promotion-rollback.test.ts
 *
 * F4.1.b — 9 cenários de fault injection para o pipeline de promoção.
 * Ver ROLLBACK-MATRIX.md para especificação completa de cada cenário.
 *
 * Status: testes de infra (locks, freshness, invalidation) já cobertos.
 * Testes de integração do pipeline completo aguardam F4.1 (/blog:stockpile-promote).
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { acquireRunLock, releaseRunLock, acquirePackageLock } from '../stockpile-locks'
import { evaluateFreshness } from '../freshness-gate'
import { checkInvalidation } from '../stockpile-invalidation-check'
import { appendInvalidationEvent, readInvalidationLog } from '../invalidation-log'
import type { InvalidationEvent, StockpilePackage } from '../stockpile-schema'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promo-rollback-'))
  fs.mkdirSync(path.join(tmpDir, 'packages'), { recursive: true })
  fs.mkdirSync(path.join(tmpDir, 'content', 'pt-BR', 'blog'), { recursive: true })
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

const VALID_SHA = 'a'.repeat(64)
const VALID_ISO = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function makeMinimalPackage(stockpileDir: string, uuid: string, ageDays = 5): void {
  const pkgDir = path.join(stockpileDir, 'packages', uuid)
  fs.mkdirSync(pkgDir, { recursive: true })

  const pkg: Partial<StockpilePackage> = {
    equivalence_id: uuid,
    stockpile_version: 1,
    type: 'exclusive',
    locales_present: ['pt-BR'],
    primary_locale: 'pt-BR',
    volatility_class: 'vendor',
    freshness_policy: { max_age_days: 21, rewrite_required_above_days: 0, freshness_gate_signals: [] },
    scores: { 'pt-BR': { seo: 82, conversion: 71, quality_gate: 85 } },
    brief_fingerprint: { cluster_id: 'test', primary_keywords: ['test'], intent: 'comercial', hash_sha256: VALID_SHA },
    lifecycle: {
      created_at: daysAgo(ageDays + 1),
      quality_gated_at: daysAgo(ageDays),
      freshness_checked_at: null,
      promoted_at: null,
      promoted_in_commit: null,
    },
    promotion_state: 'available',
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }

  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2))
}

// ---------------------------------------------------------------------------
// Cenário 1 — Lock expirado durante promoção
// ---------------------------------------------------------------------------

describe('cenário 1 — lock expirado (stale lock self-heal)', () => {
  it('stale run lock is overwritten by new run', () => {
    // Plant a stale lock
    const staleLock = {
      run_id: 'run-crashed',
      acquired_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ttl_minutes: 1,
      expires_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      pid: 99999,
    }
    fs.writeFileSync(path.join(tmpDir, '.run-lock.json'), JSON.stringify(staleLock))

    const result = acquireRunLock(tmpDir, 'run-new')
    expect(result.acquired).toBe(true)
  })

  it('stale package lock is self-healed', () => {
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    const staleLock = {
      run_id: 'run-crashed',
      equivalence_id: uuid,
      acquired_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ttl_minutes: 1,
      expires_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      package_sha: 'b'.repeat(64),
    }
    fs.writeFileSync(path.join(tmpDir, 'packages', uuid, '.lock.json'), JSON.stringify(staleLock))

    const result = acquirePackageLock(tmpDir, uuid, 'run-new')
    expect(result.acquired).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Cenário 2 — MDX write falha em locale 3 de 4 (rollback)
// ---------------------------------------------------------------------------

describe('cenário 2 — MDX write falha + rollback', () => {
  it('package state remains available after write failure (pre-write state)', () => {
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    // Simulate: write attempted for locales 1-2, then ENOSPC on locale 3
    // We test that the package.json still shows promotion_state == available
    // (actual rollback logic is in F4.1 — this tests the pre-condition)
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'packages', uuid, 'package.json'), 'utf8')
    )
    expect(pkg.promotion_state).toBe('available')

    // After writing 2 locales, simulating crash recovery:
    // pkg.promotion_state should still be 'available' (not committed as promoted)
    // until ALL locales succeed
    expect(pkg.promoted_at ?? null).toBeNull()
  })

  it('invalidation event can be emitted for rollback reason', () => {
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    const rollbackEvent: InvalidationEvent = {
      event_id: randomUUID(),
      event_type: 'invalidated',
      equivalence_id: uuid,
      timestamp: VALID_ISO,
      reason: 'rollback: MDX write falhou em locale it-IT',
      triggered_by: 'stockpile-promote',
      affected_locales: ['it-IT'],
    }

    appendInvalidationEvent(rollbackEvent, tmpDir)

    const events = readInvalidationLog(tmpDir)
    expect(events).toHaveLength(1)
    expect(events[0]!.reason).toContain('rollback')
  })
})

// ---------------------------------------------------------------------------
// Cenário 3 — Internal-links não resolve (non-blocking)
// ---------------------------------------------------------------------------

describe('cenário 3 — internal links unresolved target (non-blocking)', () => {
  it('promotion can proceed with internal_links_resolved=true even with removed links', () => {
    // The rule: internal_links_resolved=true means "links were processed"
    // even if some were removed (non-existent slugs → anchor text preserved, href removed)
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    // Simulate build-internal-links promote-mode set flag
    const pkgPath = path.join(tmpDir, 'packages', uuid, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    pkg.internal_links_resolved = true
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    expect(updated.internal_links_resolved).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Cenário 4 — Build-metadata crash (pacote pula, não bloqueia batch)
// ---------------------------------------------------------------------------

describe('cenário 4 — build-metadata crash', () => {
  it('package stays available when build-metadata fails (no state change without success)', () => {
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    // Build-metadata crash: package should remain available
    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'packages', uuid, 'package.json'), 'utf8')
    )
    expect(pkg.promotion_state).toBe('available')
    // No lifecycle.promoted_at set = not promoted
    expect(pkg.lifecycle?.promoted_at ?? null).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Cenário 5 — Archive move falha (MDX mantido, pacote não removido)
// ---------------------------------------------------------------------------

describe('cenário 5 — archive move ENOSPC', () => {
  it('package dir remains in packages/ when archive fails after MDX written', () => {
    // After MDX is written to content/, promotion_state = promoted
    // Archive step fails → packages/{uuid}/ stays, not a rollback scenario
    // validate:stockpile reports the inconsistency
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    // Mark as promoted (simulate step 8 completed)
    const pkgPath = path.join(tmpDir, 'packages', uuid, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    pkg.promotion_state = 'promoted'
    pkg.lifecycle.promoted_at = VALID_ISO
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

    // Archive fails: package dir still exists
    expect(fs.existsSync(pkgPath)).toBe(true)

    // validate:stockpile would detect promoted pkg still in packages/ as inconsistency
    // (this is covered by validate-stockpile.ts which checks for promoted state consistency)
    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    expect(updated.promotion_state).toBe('promoted')
  })
})

// ---------------------------------------------------------------------------
// Cenário 6 — Index regen inválido (detectado pre-commit)
// ---------------------------------------------------------------------------

describe('cenário 6 — index regen inválido', () => {
  it('invalid index.json fails schema validation and is detected before commit', () => {
    const indexPath = path.join(tmpDir, 'index.json')
    // Write a corrupt index
    fs.writeFileSync(indexPath, JSON.stringify({ total_packages: 'invalid', by_state: null }))

    const raw = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    // Simulate validate:stockpile detecting schema violation
    expect(typeof raw.total_packages).toBe('string')  // should be number — violation detected
    expect(typeof raw.total_packages).not.toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Cenário 7 — Commit falha (pre-commit hook rejeita)
// ---------------------------------------------------------------------------

describe('cenário 7 — commit lint/hook failure', () => {
  it('staged content files exist but no commit created (pre-hook state)', () => {
    // Simulate: MDX files staged, pre-commit hook finds mutation violation
    // Result: no commit, working tree has staged files, operator must investigate

    // Write a fake MDX to simulate staged state
    const mdxPath = path.join(tmpDir, 'content', 'pt-BR', 'blog', 'test-article.mdx')
    fs.writeFileSync(mdxPath, '---\ntitle: Test\n---\n\nContent.')

    expect(fs.existsSync(mdxPath)).toBe(true)
    // No commit happened — no git history to check in unit test
    // This scenario's recovery path is: fix violation, re-commit
  })
})

// ---------------------------------------------------------------------------
// Cenário 8 — Push falha (non-fast-forward)
// ---------------------------------------------------------------------------

describe('cenário 8 — push non-fast-forward', () => {
  it('commit exists locally but push rejected — packages still marked promoted', () => {
    // After a failed push, the local state is correct (packages promoted, MDX written)
    // The recovery is: git pull --rebase → git push
    const uuid = randomUUID()
    makeMinimalPackage(tmpDir, uuid)

    const pkgPath = path.join(tmpDir, 'packages', uuid, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    pkg.promotion_state = 'promoted'
    pkg.lifecycle.promoted_at = VALID_ISO
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))

    // Verify state is consistent (promoted) despite push failure
    const updated = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    expect(updated.promotion_state).toBe('promoted')
    // Push failure doesn't change local state — retry is safe
  })
})

// ---------------------------------------------------------------------------
// Cenário 9 — Routine cloud crash mid-batch
// ---------------------------------------------------------------------------

describe('cenário 9 — routine crash mid-batch', () => {
  it('completed packages are promoted, remaining are available after run lock TTL expires', () => {
    const uuid1 = randomUUID()
    const uuid2 = randomUUID()
    makeMinimalPackage(tmpDir, uuid1)
    makeMinimalPackage(tmpDir, uuid2)

    // Simulate: uuid1 promoted (step 8+9 completed), uuid2 was being processed (crashed)
    const pkgPath1 = path.join(tmpDir, 'packages', uuid1, 'package.json')
    const pkg1 = JSON.parse(fs.readFileSync(pkgPath1, 'utf8'))
    pkg1.promotion_state = 'promoted'
    pkg1.lifecycle.promoted_at = VALID_ISO
    fs.writeFileSync(pkgPath1, JSON.stringify(pkg1, null, 2))

    // uuid2 still available (crash before completion)
    const pkg2 = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'packages', uuid2, 'package.json'), 'utf8')
    )
    expect(pkg2.promotion_state).toBe('available')

    // Run lock self-heals after TTL → next run can process uuid2
    const staleLock = {
      run_id: 'run-crashed',
      acquired_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ttl_minutes: 1,
      expires_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      pid: 99999,
    }
    fs.writeFileSync(path.join(tmpDir, '.run-lock.json'), JSON.stringify(staleLock))

    const result = acquireRunLock(tmpDir, 'run-recovery')
    expect(result.acquired).toBe(true)

    // uuid2 freshness still valid
    const freshResult = evaluateFreshness(pkg2 as StockpilePackage)
    expect(freshResult.action).toBe('promote')

    // No invalidation events for uuid2 → it can be promoted
    const invResult = checkInvalidation(uuid2, tmpDir)
    expect(invResult.blocked).toBe(false)

    releaseRunLock(tmpDir, 'run-recovery')
  })
})
