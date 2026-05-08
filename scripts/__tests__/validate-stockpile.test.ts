/**
 * scripts/__tests__/validate-stockpile.test.ts
 *
 * Testes de integração para validate-stockpile.ts.
 * Usa diretórios temporários reais para simular o stockpile.
 *
 * F1.2 — critério: exit code 0/1 conforme válido/inválido.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { runValidation } from '../validate-stockpile'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_UUID_2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
const VALID_ISO = '2026-05-06T14:00:00Z'
const VALID_SHA256 = 'a'.repeat(64)

function makeValidPackageJson(eqId: string = VALID_UUID): object {
  return {
    equivalence_id: eqId,
    stockpile_version: 1,
    type: 'universal',
    locales_present: ['pt-BR', 'en'],
    primary_locale: 'pt-BR',
    volatility_class: 'vendor',
    freshness_policy: {
      max_age_days: 21,
      rewrite_required_above_days: 45,
      freshness_gate_signals: [],
    },
    scores: {
      'pt-BR': { seo: 82, conversion: 75, quality_gate: 88 },
      'en': { seo: 79, conversion: 70, quality_gate: 84 },
    },
    brief_fingerprint: {
      cluster_id: 'cluster-001',
      primary_keywords: ['next.js'],
      intent: 'comercial',
      hash_sha256: VALID_SHA256,
    },
    lifecycle: {
      created_at: VALID_ISO,
      quality_gated_at: VALID_ISO,
      freshness_checked_at: null,
      promoted_at: null,
      promoted_in_commit: null,
    },
    promotion_state: 'available',
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }
}

function makeValidInvalidationEvent(eqId: string = VALID_UUID): object {
  return {
    event_id: VALID_UUID_2,
    event_type: 'invalidated',
    equivalence_id: eqId,
    timestamp: VALID_ISO,
    reason: 'pricing data outdated',
    triggered_by: 'auto-blog-routine',
    affected_locales: ['pt-BR'],
  }
}

// ---------------------------------------------------------------------------
// Helpers para criar estrutura de diretórios temp
// ---------------------------------------------------------------------------

let tmpDir: string

function createStockpileDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockpile-test-'))
  fs.mkdirSync(path.join(dir, 'packages'), { recursive: true })
  return dir
}

function addPackage(stockpileDir: string, eqId: string, pkg?: object): void {
  const pkgDir = path.join(stockpileDir, 'packages', eqId)
  fs.mkdirSync(path.join(pkgDir, 'pt-BR'), { recursive: true })
  fs.mkdirSync(path.join(pkgDir, 'en'), { recursive: true })
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(pkg ?? makeValidPackageJson(eqId)),
  )
  fs.writeFileSync(path.join(pkgDir, 'pt-BR', 'reviewed.md'), '# Artigo revisado\n')
  fs.writeFileSync(path.join(pkgDir, 'pt-BR', 'metadata.json'), '{}')
  fs.writeFileSync(path.join(pkgDir, 'en', 'reviewed.md'), '# Reviewed article\n')
  fs.writeFileSync(path.join(pkgDir, 'en', 'metadata.json'), '{}')
}

function cleanupDir(dir: string): void {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

beforeEach(() => {
  tmpDir = createStockpileDir()
})

afterEach(() => {
  cleanupDir(tmpDir)
})

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('runValidation — stockpile vazio', () => {
  it('passa com 0 pacotes e sem index/log', () => {
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
    expect(result.stats.packages_scanned).toBe(0)
  })

  it('retorna erro quando diretório não existe', () => {
    const result = runValidation('/tmp/stockpile-nonexistent-xyz')
    expect(result.errors.some(e => e.code === 'DIR_NOT_FOUND')).toBe(true)
  })
})

describe('runValidation — pacote válido', () => {
  it('passa com 1 pacote válido', () => {
    addPackage(tmpDir, VALID_UUID)
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
    expect(result.stats.packages_scanned).toBe(1)
  })

  it('passa com múltiplos pacotes válidos', () => {
    addPackage(tmpDir, VALID_UUID)
    addPackage(tmpDir, VALID_UUID_2, makeValidPackageJson(VALID_UUID_2))
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
    expect(result.stats.packages_scanned).toBe(2)
  })

  it('completa em menos de 2s para 10 pacotes', () => {
    // Gerar 10 UUIDs sintéticos
    for (let i = 0; i < 10; i++) {
      const eqId = `550e8400-e29b-41d4-a716-00000000${String(i).padStart(4, '0')}`
      addPackage(tmpDir, eqId, makeValidPackageJson(eqId))
    }
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
    expect(result.stats.duration_ms).toBeLessThan(2000)
  })
})

describe('runValidation — erros de pacote', () => {
  it('detecta package.json ausente', () => {
    const pkgDir = path.join(tmpDir, 'packages', VALID_UUID)
    fs.mkdirSync(pkgDir, { recursive: true })
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'PKG_MISSING_JSON')).toBe(true)
  })

  it('detecta package.json com schema inválido', () => {
    const pkgDir = path.join(tmpDir, 'packages', VALID_UUID)
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ invalid: true }))
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'PKG_SCHEMA_INVALID')).toBe(true)
  })

  it('detecta mismatch entre dir name e equivalence_id', () => {
    // Dir name diferente do equivalence_id dentro do JSON
    const wrongDir = path.join(tmpDir, 'packages', VALID_UUID_2)
    fs.mkdirSync(path.join(wrongDir, 'pt-BR'), { recursive: true })
    fs.mkdirSync(path.join(wrongDir, 'en'), { recursive: true })
    fs.writeFileSync(
      path.join(wrongDir, 'package.json'),
      JSON.stringify(makeValidPackageJson(VALID_UUID)),  // UUID diferente do dir
    )
    fs.writeFileSync(path.join(wrongDir, 'pt-BR', 'reviewed.md'), '')
    fs.writeFileSync(path.join(wrongDir, 'pt-BR', 'metadata.json'), '{}')
    fs.writeFileSync(path.join(wrongDir, 'en', 'reviewed.md'), '')
    fs.writeFileSync(path.join(wrongDir, 'en', 'metadata.json'), '{}')

    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'PKG_ID_MISMATCH')).toBe(true)
  })

  it('detecta reviewed.md ausente para locale declarado', () => {
    addPackage(tmpDir, VALID_UUID)
    fs.unlinkSync(path.join(tmpDir, 'packages', VALID_UUID, 'pt-BR', 'reviewed.md'))
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'PKG_MISSING_REVIEWED_MD')).toBe(true)
  })

  it('detecta metadata.json ausente para locale declarado', () => {
    addPackage(tmpDir, VALID_UUID)
    fs.unlinkSync(path.join(tmpDir, 'packages', VALID_UUID, 'en', 'metadata.json'))
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'PKG_MISSING_METADATA_JSON')).toBe(true)
  })
})

describe('runValidation — index.json', () => {
  it('passa quando index.json não existe', () => {
    addPackage(tmpDir, VALID_UUID)
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
  })

  it('valida index.json com schema correto', () => {
    addPackage(tmpDir, VALID_UUID)
    const index = {
      generated_at: VALID_ISO,
      total_packages: 1,
      by_state: { available: 1, locked: 0, invalidated: 0, quarantine: 0 },
      by_type: { exclusive: 0, bilingual: 0, trilingual: 0, universal: 1 },
      packages: [{
        equivalence_id: VALID_UUID,
        type: 'universal',
        locales_present: ['pt-BR', 'en'],
        promotion_state: 'available',
        volatility_class: 'vendor',
        quality_gated_at: VALID_ISO,
        freshness_checked_at: null,
      }],
    }
    fs.writeFileSync(path.join(tmpDir, 'index.json'), JSON.stringify(index))
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
  })

  it('detecta index.json com JSON inválido', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.json'), '{broken json')
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'INDEX_PARSE_ERROR')).toBe(true)
  })

  it('detecta index.json com schema inválido', () => {
    fs.writeFileSync(path.join(tmpDir, 'index.json'), JSON.stringify({ invalid: true }))
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'INDEX_SCHEMA_INVALID')).toBe(true)
  })

  it('detecta total_packages inconsistente', () => {
    addPackage(tmpDir, VALID_UUID)
    const index = {
      generated_at: VALID_ISO,
      total_packages: 99,  // errado
      by_state: { available: 1, locked: 0, invalidated: 0, quarantine: 0 },
      by_type: { exclusive: 0, bilingual: 0, trilingual: 0, universal: 1 },
      packages: [{
        equivalence_id: VALID_UUID,
        type: 'universal',
        locales_present: ['pt-BR', 'en'],
        promotion_state: 'available',
        volatility_class: 'vendor',
        quality_gated_at: VALID_ISO,
        freshness_checked_at: null,
      }],
    }
    fs.writeFileSync(path.join(tmpDir, 'index.json'), JSON.stringify(index))
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'INDEX_COUNT_MISMATCH')).toBe(true)
  })

  it('emite warning para entrada do index sem package.json físico', () => {
    const index = {
      generated_at: VALID_ISO,
      total_packages: 1,
      by_state: { available: 1, locked: 0, invalidated: 0, quarantine: 0 },
      by_type: { exclusive: 0, bilingual: 0, trilingual: 0, universal: 1 },
      packages: [{
        equivalence_id: VALID_UUID,
        type: 'universal',
        locales_present: ['pt-BR'],
        promotion_state: 'available',
        volatility_class: 'vendor',
        quality_gated_at: VALID_ISO,
        freshness_checked_at: null,
      }],
    }
    fs.writeFileSync(path.join(tmpDir, 'index.json'), JSON.stringify(index))
    const result = runValidation(tmpDir)
    expect(result.warnings.some(w => w.includes(VALID_UUID))).toBe(true)
  })
})

describe('runValidation — invalidation-log.jsonl', () => {
  it('passa quando log não existe', () => {
    addPackage(tmpDir, VALID_UUID)
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
  })

  it('valida log com evento válido', () => {
    addPackage(tmpDir, VALID_UUID)
    const event = makeValidInvalidationEvent(VALID_UUID)
    fs.writeFileSync(
      path.join(tmpDir, 'invalidation-log.jsonl'),
      JSON.stringify(event) + '\n',
    )
    const result = runValidation(tmpDir)
    expect(result.errors).toHaveLength(0)
  })

  it('detecta linha com JSON inválido', () => {
    fs.writeFileSync(path.join(tmpDir, 'invalidation-log.jsonl'), '{broken\n')
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'LOG_PARSE_ERROR')).toBe(true)
  })

  it('detecta evento com schema inválido', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'invalidation-log.jsonl'),
      JSON.stringify({ event_id: 'not-uuid' }) + '\n',
    )
    const result = runValidation(tmpDir)
    expect(result.errors.some(e => e.code === 'LOG_EVENT_INVALID')).toBe(true)
  })

  it('emite warning para equivalence_id não encontrado em packages/ (pode estar em _archived/)', () => {
    const event = makeValidInvalidationEvent('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    fs.writeFileSync(
      path.join(tmpDir, 'invalidation-log.jsonl'),
      JSON.stringify(event) + '\n',
    )
    const result = runValidation(tmpDir)
    expect(result.warnings.some(w => w.includes('_archived/'))).toBe(true)
  })
})
