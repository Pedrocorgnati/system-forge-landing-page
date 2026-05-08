/**
 * F3.2.b — testes para cluster-drift-detection.ts
 *
 * Critérios de aceite:
 *  - Cluster presente com score alto → sem drift
 *  - Cluster ausente do arquivo → drift (motivo: "ausente")
 *  - Cluster presente com score baixo → drift (motivo: score abaixo do threshold)
 *  - Arquivo não existe → sem drift (repo virgem, sem dados de comparação)
 *  - Threshold customizado é respeitado
 *  - batchCheckClusterDrift() cobre múltiplos pacotes e locales
 *  - hasDrift() e driftReason() retornam valores corretos
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  batchCheckClusterDrift,
  checkClusterDrift,
  DEFAULT_MIN_PRIORITY_SCORE,
  driftReason,
  hasDrift,
  loadClusterScores,
  type ClusterDriftResult,
} from '../cluster-drift-detection'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cluster-drift-test-'))
}

function writeTopics(dir: string, locale: string, topics: Array<{ cluster_id: string; priority_score: number; [k: string]: unknown }>) {
  const localeDir = path.join(dir, locale, 'prioritized-topics')
  fs.mkdirSync(localeDir, { recursive: true })
  fs.writeFileSync(path.join(localeDir, 'prioritized-topics.json'), JSON.stringify(topics, null, 2))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('loadClusterScores', () => {
  let tmpDir: string
  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('carrega mapa cluster_id → score corretamente', () => {
    const topicsPath = path.join(tmpDir, 'topics.json')
    fs.writeFileSync(topicsPath, JSON.stringify([
      { cluster_id: 'alpha', priority_score: 80 },
      { cluster_id: 'beta', priority_score: 45 },
    ]))
    const map = loadClusterScores(topicsPath)
    expect(map.get('alpha')).toBe(80)
    expect(map.get('beta')).toBe(45)
    expect(map.size).toBe(2)
  })

  it('lança erro se arquivo não existir', () => {
    expect(() => loadClusterScores(path.join(tmpDir, 'nope.json'))).toThrow('[cluster-drift]')
  })

  it('lança erro se conteúdo não for array', () => {
    const p = path.join(tmpDir, 'bad.json')
    fs.writeFileSync(p, JSON.stringify({ clusters: [] }))
    expect(() => loadClusterScores(p)).toThrow('[cluster-drift]')
  })

  it('ignora entradas sem cluster_id ou priority_score', () => {
    const p = path.join(tmpDir, 'topics.json')
    fs.writeFileSync(p, JSON.stringify([
      { cluster_id: 'valid', priority_score: 70 },
      { keyword: 'only keyword' },
      { cluster_id: 'no-score' },
    ]))
    const map = loadClusterScores(p)
    expect(map.size).toBe(1)
    expect(map.get('valid')).toBe(70)
  })
})

describe('checkClusterDrift', () => {
  let tmpDir: string
  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  const topicsPath = () => path.join(tmpDir, 'prioritized-topics.json')

  function writeTopicsFile(topics: Array<{ cluster_id: string; priority_score: number }>) {
    fs.writeFileSync(topicsPath(), JSON.stringify(topics))
  }

  it('cluster com score alto → sem drift', () => {
    writeTopicsFile([{ cluster_id: 'alpha', priority_score: 85 }])
    const result = checkClusterDrift('alpha', topicsPath())
    expect(result.drifted).toBe(false)
    expect(result.found).toBe(true)
    expect(result.current_score).toBe(85)
    expect(result.reason).toBeNull()
  })

  it('cluster exatamente no threshold → sem drift', () => {
    writeTopicsFile([{ cluster_id: 'edge', priority_score: DEFAULT_MIN_PRIORITY_SCORE }])
    const result = checkClusterDrift('edge', topicsPath())
    expect(result.drifted).toBe(false)
  })

  it('cluster ausente do arquivo → drift', () => {
    writeTopicsFile([{ cluster_id: 'other', priority_score: 80 }])
    const result = checkClusterDrift('missing-cluster', topicsPath())
    expect(result.drifted).toBe(true)
    expect(result.found).toBe(false)
    expect(result.reason).toContain('ausente de prioritized-topics.json')
  })

  it('cluster com score abaixo do threshold → drift', () => {
    writeTopicsFile([{ cluster_id: 'weak', priority_score: 30 }])
    const result = checkClusterDrift('weak', topicsPath())
    expect(result.drifted).toBe(true)
    expect(result.found).toBe(true)
    expect(result.current_score).toBe(30)
    expect(result.reason).toContain('priority_score=30')
    expect(result.reason).toContain(`threshold=${DEFAULT_MIN_PRIORITY_SCORE}`)
  })

  it('threshold customizado é respeitado', () => {
    writeTopicsFile([{ cluster_id: 'custom', priority_score: 65 }])
    // Com threshold=70, score=65 é drift
    const drifted = checkClusterDrift('custom', topicsPath(), 70)
    expect(drifted.drifted).toBe(true)
    expect(drifted.min_score_threshold).toBe(70)

    // Com threshold=60, score=65 é ok
    const ok = checkClusterDrift('custom', topicsPath(), 60)
    expect(ok.drifted).toBe(false)
  })

  it('arquivo inexistente → sem drift (repo virgem)', () => {
    const result = checkClusterDrift('any-cluster', path.join(tmpDir, 'nonexistent.json'))
    expect(result.drifted).toBe(false)
    expect(result.found).toBe(false)
    expect(result.reason).toBeNull()
  })
})

describe('batchCheckClusterDrift', () => {
  let tmpDir: string
  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('verifica múltiplos pacotes em múltiplos locales', () => {
    writeTopics(tmpDir, 'pt-BR', [
      { cluster_id: 'alpha', priority_score: 80 },
      { cluster_id: 'weak', priority_score: 30 },
    ])
    writeTopics(tmpDir, 'en', [
      { cluster_id: 'alpha', priority_score: 75 },
      // 'weak' removido em en
    ])

    const packages = [
      { equivalenceId: 'uuid-1', cluster_id: 'alpha', locales_present: ['pt-BR', 'en'] },
      { equivalenceId: 'uuid-2', cluster_id: 'weak', locales_present: ['pt-BR', 'en'] },
    ]

    const results = batchCheckClusterDrift(packages, tmpDir)

    const alphaResults = results.get('uuid-1')!
    expect(alphaResults).toHaveLength(2)
    expect(alphaResults.every(r => !r.drifted)).toBe(true)

    const weakResults = results.get('uuid-2') ?? []
    expect(weakResults).toHaveLength(2)
    // pt-BR: score 30 < 50 → drift
    expect(weakResults[0]?.drifted).toBe(true)
    // en: ausente → drift
    expect(weakResults[1]?.drifted).toBe(true)
  })

  it('retorna mapa vazio para lista de pacotes vazia', () => {
    const results = batchCheckClusterDrift([], tmpDir)
    expect(results.size).toBe(0)
  })
})

describe('hasDrift e driftReason', () => {
  const noDrift: ClusterDriftResult = {
    cluster_id: 'c1',
    found: true,
    current_score: 80,
    min_score_threshold: 50,
    drifted: false,
    reason: null,
  }
  const withDrift: ClusterDriftResult = {
    cluster_id: 'c2',
    found: false,
    min_score_threshold: 50,
    drifted: true,
    reason: "cluster 'c2' ausente de prioritized-topics.json",
  }

  it('hasDrift() retorna false se nenhum resultado tiver drift', () => {
    expect(hasDrift([noDrift, noDrift])).toBe(false)
  })

  it('hasDrift() retorna true se qualquer resultado tiver drift', () => {
    expect(hasDrift([noDrift, withDrift])).toBe(true)
  })

  it('hasDrift() retorna false para array vazio', () => {
    expect(hasDrift([])).toBe(false)
  })

  it('driftReason() retorna o primeiro motivo de drift', () => {
    expect(driftReason([noDrift, withDrift])).toBe(withDrift.reason)
  })

  it('driftReason() retorna null se sem drift', () => {
    expect(driftReason([noDrift])).toBeNull()
  })

  it('driftReason() retorna null para array vazio', () => {
    expect(driftReason([])).toBeNull()
  })
})
