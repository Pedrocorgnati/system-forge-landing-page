/**
 * scripts/__tests__/regenerate-stockpile-index.test.ts
 *
 * F1.3 — critério: 2 runs consecutivas = output idêntico; 0 pacotes = { packages: [], ... }
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { regenerateIndex } from '../regenerate-stockpile-index'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_UUID_2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const VALID_ISO = '2026-05-06T14:00:00Z'
const VALID_SHA256 = 'a'.repeat(64)

function makeValidPkg(eqId: string) {
  return {
    equivalence_id: eqId,
    stockpile_version: 1,
    type: 'universal',
    locales_present: ['pt-BR'],
    primary_locale: 'pt-BR',
    volatility_class: 'vendor',
    freshness_policy: { max_age_days: 21, rewrite_required_above_days: 45, freshness_gate_signals: [] },
    scores: { 'pt-BR': { seo: 80, conversion: 70, quality_gate: 85 } },
    brief_fingerprint: { cluster_id: 'c1', primary_keywords: ['kw'], intent: 'comercial', hash_sha256: VALID_SHA256 },
    lifecycle: { created_at: VALID_ISO, quality_gated_at: VALID_ISO, freshness_checked_at: null, promoted_at: null, promoted_in_commit: null },
    promotion_state: 'available',
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }
}

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockpile-idx-test-'))
  fs.mkdirSync(path.join(tmpDir, 'packages'), { recursive: true })
})

afterEach(() => {
  if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('regenerateIndex', () => {
  it('retorna index vazio com 0 pacotes', () => {
    const idx = regenerateIndex(tmpDir, VALID_ISO)
    expect(idx.total_packages).toBe(0)
    expect(idx.packages).toHaveLength(0)
    expect(idx.by_state.available).toBe(0)
    expect(idx.by_type.universal).toBe(0)
  })

  it('retorna index com 1 pacote válido', () => {
    const pkgDir = path.join(tmpDir, 'packages', VALID_UUID)
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(makeValidPkg(VALID_UUID)))

    const idx = regenerateIndex(tmpDir, VALID_ISO)
    expect(idx.total_packages).toBe(1)
    expect(idx.packages[0]?.equivalence_id).toBe(VALID_UUID)
    expect(idx.by_state.available).toBe(1)
    expect(idx.by_type.universal).toBe(1)
  })

  it('é idempotente: 2 runs com mesmo timestamp produzem output idêntico', () => {
    const pkgDir = path.join(tmpDir, 'packages', VALID_UUID)
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(makeValidPkg(VALID_UUID)))

    const run1 = regenerateIndex(tmpDir, VALID_ISO)
    const run2 = regenerateIndex(tmpDir, VALID_ISO)

    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2))
  })

  it('pacotes inválidos são ignorados (sem throw)', () => {
    const pkgDir = path.join(tmpDir, 'packages', VALID_UUID)
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), '{"invalid":true}')

    const idx = regenerateIndex(tmpDir, VALID_ISO)
    expect(idx.total_packages).toBe(0)
  })

  it('contabiliza by_state e by_type corretamente com múltiplos pacotes', () => {
    for (const [eqId, state, type] of [
      [VALID_UUID, 'available', 'universal'],
      [VALID_UUID_2, 'locked', 'exclusive'],
    ] as const) {
      const pkgDir = path.join(tmpDir, 'packages', eqId)
      fs.mkdirSync(pkgDir, { recursive: true })
      fs.writeFileSync(
        path.join(pkgDir, 'package.json'),
        JSON.stringify({ ...makeValidPkg(eqId), promotion_state: state, type }),
      )
    }

    const idx = regenerateIndex(tmpDir, VALID_ISO)
    expect(idx.total_packages).toBe(2)
    expect(idx.by_state.available).toBe(1)
    expect(idx.by_state.locked).toBe(1)
    expect(idx.by_type.universal).toBe(1)
    expect(idx.by_type.exclusive).toBe(1)
  })

  it('packages são ordenados deterministicamente por nome de dir', () => {
    for (const eqId of [VALID_UUID_2, VALID_UUID]) {
      const pkgDir = path.join(tmpDir, 'packages', eqId)
      fs.mkdirSync(pkgDir, { recursive: true })
      fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(makeValidPkg(eqId)))
    }

    const idx = regenerateIndex(tmpDir, VALID_ISO)
    expect(idx.packages[0]!.equivalence_id < idx.packages[1]!.equivalence_id).toBe(true)
  })
})
