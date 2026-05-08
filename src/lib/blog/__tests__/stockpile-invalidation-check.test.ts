/**
 * src/lib/blog/__tests__/stockpile-invalidation-check.test.ts
 *
 * F3.4 — testa a lógica de verificação de invalidação antes de promover pacotes.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { checkInvalidation, applyInvalidationToPackage, batchCheckInvalidation } from '../stockpile-invalidation-check'
import { appendInvalidationEvent } from '../invalidation-log'
import type { InvalidationEvent } from '../stockpile-schema'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-check-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function iso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function makeEvent(
  equivalenceId: string,
  eventType: InvalidationEvent['event_type'],
  overrides: Partial<InvalidationEvent> = {},
): InvalidationEvent {
  return {
    event_id: randomUUID(),
    event_type: eventType,
    equivalence_id: equivalenceId,
    timestamp: iso(),
    reason: `test reason for ${eventType}`,
    triggered_by: 'test-suite',
    affected_locales: ['pt-BR'],
    ...overrides,
  }
}

function makePackageJson(stockpileDir: string, uuid: string, promotionState = 'available'): void {
  const pkgDir = path.join(stockpileDir, 'packages', uuid)
  fs.mkdirSync(pkgDir, { recursive: true })
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ equivalence_id: uuid, promotion_state: promotionState, invalidation_reason: null }),
  )
}

// ---------------------------------------------------------------------------
// checkInvalidation
// ---------------------------------------------------------------------------

describe('checkInvalidation', () => {
  it('returns not blocked when no events exist', () => {
    const result = checkInvalidation(randomUUID(), tmpDir)
    expect(result.blocked).toBe(false)
    expect(result.reason).toBeNull()
  })

  it('blocks on invalidated event', () => {
    const eqid = randomUUID()
    appendInvalidationEvent(makeEvent(eqid, 'invalidated', { reason: 'link rompido' }), tmpDir)

    const result = checkInvalidation(eqid, tmpDir)
    expect(result.blocked).toBe(true)
    expect(result.reason).toBe('link rompido')
  })

  it('blocks on quarantine event', () => {
    const eqid = randomUUID()
    appendInvalidationEvent(makeEvent(eqid, 'quarantine', { reason: 'score abaixo do limite' }), tmpDir)

    const result = checkInvalidation(eqid, tmpDir)
    expect(result.blocked).toBe(true)
  })

  it('unblocks when refreshed event follows invalidated', () => {
    const eqid = randomUUID()
    appendInvalidationEvent(makeEvent(eqid, 'invalidated', { timestamp: iso(-2000) }), tmpDir)
    appendInvalidationEvent(makeEvent(eqid, 'refreshed', { timestamp: iso(-1000) }), tmpDir)

    const result = checkInvalidation(eqid, tmpDir)
    expect(result.blocked).toBe(false)
  })

  it('unblocks when promoted event follows quarantine', () => {
    const eqid = randomUUID()
    appendInvalidationEvent(makeEvent(eqid, 'quarantine', { timestamp: iso(-2000) }), tmpDir)
    appendInvalidationEvent(makeEvent(eqid, 'promoted', { timestamp: iso(-1000) }), tmpDir)

    const result = checkInvalidation(eqid, tmpDir)
    expect(result.blocked).toBe(false)
  })

  it('re-blocks if invalidated event comes after clearing event', () => {
    const eqid = randomUUID()
    appendInvalidationEvent(makeEvent(eqid, 'invalidated', { timestamp: iso(-4000) }), tmpDir)
    appendInvalidationEvent(makeEvent(eqid, 'refreshed', { timestamp: iso(-3000) }), tmpDir)
    appendInvalidationEvent(makeEvent(eqid, 'invalidated', { timestamp: iso(-2000), reason: 'slug deletado' }), tmpDir)

    const result = checkInvalidation(eqid, tmpDir)
    expect(result.blocked).toBe(true)
    expect(result.reason).toBe('slug deletado')
  })

  it('ignores stale events (>90 days old)', () => {
    const eqid = randomUUID()
    const ninetyOneDaysAgo = iso(-(91 * 24 * 60 * 60 * 1000))
    appendInvalidationEvent(makeEvent(eqid, 'invalidated', { timestamp: ninetyOneDaysAgo }), tmpDir)

    const result = checkInvalidation(eqid, tmpDir)
    expect(result.blocked).toBe(false)
    expect(result.ignoredStaleEvents).toBe(1)
  })

  it('does not affect other equivalence_ids', () => {
    const eqid1 = randomUUID()
    const eqid2 = randomUUID()
    appendInvalidationEvent(makeEvent(eqid1, 'invalidated'), tmpDir)

    const result = checkInvalidation(eqid2, tmpDir)
    expect(result.blocked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// applyInvalidationToPackage
// ---------------------------------------------------------------------------

describe('applyInvalidationToPackage', () => {
  it('marks package as invalidated when blocked', () => {
    const uuid = randomUUID()
    makePackageJson(tmpDir, uuid)
    appendInvalidationEvent(makeEvent(uuid, 'invalidated', { reason: 'cluster drift detectado' }), tmpDir)

    const applied = applyInvalidationToPackage(uuid, tmpDir)
    expect(applied).toBe(true)

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'packages', uuid, 'package.json'), 'utf8'))
    expect(pkg.promotion_state).toBe('invalidated')
    expect(pkg.invalidation_reason).toBe('cluster drift detectado')
  })

  it('returns false and does not modify package when clean', () => {
    const uuid = randomUUID()
    makePackageJson(tmpDir, uuid)

    const applied = applyInvalidationToPackage(uuid, tmpDir)
    expect(applied).toBe(false)

    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'packages', uuid, 'package.json'), 'utf8'))
    expect(pkg.promotion_state).toBe('available')
  })

  it('returns false when package.json does not exist', () => {
    const uuid = randomUUID()
    appendInvalidationEvent(makeEvent(uuid, 'invalidated'), tmpDir)

    const applied = applyInvalidationToPackage(uuid, tmpDir)
    expect(applied).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// batchCheckInvalidation
// ---------------------------------------------------------------------------

describe('batchCheckInvalidation', () => {
  it('separates blocked from clean candidates', () => {
    const cleanId = randomUUID()
    const blockedId = randomUUID()

    appendInvalidationEvent(makeEvent(blockedId, 'invalidated'), tmpDir)

    const result = batchCheckInvalidation([cleanId, blockedId], tmpDir)

    expect(result.clean).toContain(cleanId)
    expect(result.clean).not.toContain(blockedId)
    expect(result.blocked.map(b => b.equivalenceId)).toContain(blockedId)
    expect(result.blocked.map(b => b.equivalenceId)).not.toContain(cleanId)
  })

  it('returns all clean when no events', () => {
    const ids = [randomUUID(), randomUUID(), randomUUID()]
    const result = batchCheckInvalidation(ids, tmpDir)

    expect(result.clean).toHaveLength(3)
    expect(result.blocked).toHaveLength(0)
  })

  it('returns empty arrays for empty input', () => {
    const result = batchCheckInvalidation([], tmpDir)
    expect(result.clean).toHaveLength(0)
    expect(result.blocked).toHaveLength(0)
  })
})
