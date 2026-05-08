/**
 * F5.2.a — testes unitários para stockpile-mode.ts (getStockpileMode)
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getStockpileMode } from '../stockpile-mode'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stockpile-mode-test-'))
}

function writePackage(packagesDir: string, uuid: string, state: string, qualityGatedAt: string = '2026-01-01T12:00:00Z') {
  const pkgDir = path.join(packagesDir, uuid)
  fs.mkdirSync(pkgDir, { recursive: true })
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({
    equivalence_id: uuid,
    stockpile_version: 1,
    type: 'universal',
    locales_present: ['pt-BR'],
    primary_locale: 'pt-BR',
    promotion_state: state,
    lifecycle: {
      created_at: qualityGatedAt,
      quality_gated_at: qualityGatedAt,
      freshness_checked_at: null,
      promoted_at: null,
      promoted_in_commit: null,
    },
    brief_fingerprint: { cluster_id: 'c1', primary_keywords: ['kw'], intent: 'comercial', hash_sha256: 'a'.repeat(64) },
    volatility_class: 'vendor',
    freshness_policy: { max_age_days: 21, rewrite_required_above_days: 0, freshness_gate_signals: [] },
    scores: {},
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }))
}

function makeStockpileDir(tmpDir: string): { stockpileDir: string; packagesDir: string } {
  const stockpileDir = path.join(tmpDir, 'stockpile')
  const packagesDir = path.join(stockpileDir, 'packages')
  fs.mkdirSync(packagesDir, { recursive: true })
  return { stockpileDir, packagesDir }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getStockpileMode', () => {
  let tmpDir: string
  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('Fixture 1 — estoque vazio → generate', () => {
    const { stockpileDir } = makeStockpileDir(tmpDir)
    const result = getStockpileMode(stockpileDir, 5, true)
    expect(result.mode_used).toBe('generate')
    expect(result.available_count).toBe(0)
    expect(result.promotable_ids).toHaveLength(0)
  })

  it('Fixture 2 — available < min_groups → generate', () => {
    const { stockpileDir, packagesDir } = makeStockpileDir(tmpDir)
    writePackage(packagesDir, 'uuid-1', 'available')
    writePackage(packagesDir, 'uuid-2', 'available')
    writePackage(packagesDir, 'uuid-3', 'locked')
    const result = getStockpileMode(stockpileDir, 5, true)
    expect(result.mode_used).toBe('generate')
    expect(result.available_count).toBe(2)
    expect(result.promotable_ids).toHaveLength(0)
  })

  it('Fixture 3 — available == min_groups → promote_only (boundary)', () => {
    const { stockpileDir, packagesDir } = makeStockpileDir(tmpDir)
    for (let i = 1; i <= 5; i++) writePackage(packagesDir, `uuid-${i}`, 'available')
    const result = getStockpileMode(stockpileDir, 5, true)
    expect(result.mode_used).toBe('promote_only')
    expect(result.available_count).toBe(5)
    expect(result.promotable_ids).toHaveLength(5)
    expect(result.min_groups).toBe(5)
  })

  it('Fixture 4 — available > min_groups → promote_only (contended)', () => {
    const { stockpileDir, packagesDir } = makeStockpileDir(tmpDir)
    for (let i = 1; i <= 12; i++) writePackage(packagesDir, `uuid-${i}`, 'available')
    writePackage(packagesDir, 'uuid-locked', 'locked')
    writePackage(packagesDir, 'uuid-inv', 'invalidated')
    const result = getStockpileMode(stockpileDir, 5, true)
    expect(result.mode_used).toBe('promote_only')
    expect(result.available_count).toBe(12)
    expect(result.promotable_ids).toHaveLength(12)
  })

  it('Fixture 5 — allow_promote_only=false → sempre generate', () => {
    const { stockpileDir, packagesDir } = makeStockpileDir(tmpDir)
    for (let i = 1; i <= 10; i++) writePackage(packagesDir, `uuid-${i}`, 'available')
    const result = getStockpileMode(stockpileDir, 5, false)
    expect(result.mode_used).toBe('generate')
    expect(result.available_count).toBe(0)
    expect(result.promotable_ids).toHaveLength(0)
    expect(result.decision_reason).toContain('allow_promote_only_mode=false')
  })

  it('packages/ não existe → generate com available_count=0', () => {
    const stockpileDir = path.join(tmpDir, 'empty-stockpile')
    fs.mkdirSync(stockpileDir)
    // packages/ NÃO criado
    const result = getStockpileMode(stockpileDir, 5, true)
    expect(result.mode_used).toBe('generate')
    expect(result.available_count).toBe(0)
  })

  it('promotable_ids ordenados por quality_gated_at ASC (FIFO)', () => {
    const { stockpileDir, packagesDir } = makeStockpileDir(tmpDir)
    // Escrever em ordem reversa para verificar ordenação
    writePackage(packagesDir, 'uuid-c', 'available', '2026-01-03T12:00:00Z')
    writePackage(packagesDir, 'uuid-a', 'available', '2026-01-01T12:00:00Z')
    writePackage(packagesDir, 'uuid-b', 'available', '2026-01-02T12:00:00Z')
    const result = getStockpileMode(stockpileDir, 3, true)
    expect(result.mode_used).toBe('promote_only')
    expect(result.promotable_ids[0]).toBe('uuid-a')
    expect(result.promotable_ids[1]).toBe('uuid-b')
    expect(result.promotable_ids[2]).toBe('uuid-c')
  })

  it('ignora packages/ com package.json malformado', () => {
    const { stockpileDir, packagesDir } = makeStockpileDir(tmpDir)
    writePackage(packagesDir, 'uuid-valid', 'available')
    // pacote com JSON inválido
    const badDir = path.join(packagesDir, 'uuid-bad')
    fs.mkdirSync(badDir)
    fs.writeFileSync(path.join(badDir, 'package.json'), 'NOT JSON {{}')
    const result = getStockpileMode(stockpileDir, 1, true)
    expect(result.mode_used).toBe('promote_only')
    expect(result.available_count).toBe(1)
  })
})
