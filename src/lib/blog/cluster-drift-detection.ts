/**
 * src/lib/blog/cluster-drift-detection.ts
 *
 * F3.2.b — Detecta cluster drift: clusters removidos ou severamente despriorizados
 * em prioritized-topics.json após a geração do pacote.
 *
 * Critérios de drift:
 *  1. Cluster ausente do arquivo (removido ou renomeado) → drifted = true
 *  2. priority_score atual abaixo do threshold configurável (default: 50) → drifted = true
 *  3. Arquivo de tópicos ainda não existe (repo virgem) → sem drift (sem dados para comparar)
 *
 * Spec: scheduled-updates/auto-blog/STOCKPILE-FEATURE.md — F3.2.b
 */

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_MIN_PRIORITY_SCORE = 50

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrioritizedTopic {
  cluster_id: string
  priority_score: number
  pillar?: string
  keyword_principal?: string
}

export interface ClusterDriftResult {
  cluster_id: string
  /** true se o cluster foi encontrado no arquivo de tópicos */
  found: boolean
  /** priority_score atual (undefined se cluster não encontrado) */
  current_score?: number
  /** threshold usado para comparação */
  min_score_threshold: number
  /** true se drift detectado (ausente ou score abaixo do threshold) */
  drifted: boolean
  /** descrição legível do motivo do drift, null se sem drift */
  reason: string | null
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Lê prioritized-topics.json e retorna um mapa cluster_id → priority_score.
 * Lança erro se o arquivo existir mas não for válido.
 */
export function loadClusterScores(prioritizedTopicsPath: string): Map<string, number> {
  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(prioritizedTopicsPath, 'utf8'))
  } catch (err) {
    throw new Error(`[cluster-drift] Não foi possível ler ${prioritizedTopicsPath}: ${String(err)}`)
  }

  if (!Array.isArray(raw)) {
    throw new Error(
      `[cluster-drift] Formato inválido em ${prioritizedTopicsPath}: esperado array de tópicos`,
    )
  }

  const map = new Map<string, number>()
  for (const item of raw as PrioritizedTopic[]) {
    if (typeof item.cluster_id === 'string' && typeof item.priority_score === 'number') {
      map.set(item.cluster_id, item.priority_score)
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------

/**
 * Verifica se um cluster sofreu drift em relação ao arquivo prioritized-topics.json.
 *
 * @param clusterId - cluster_id do brief_fingerprint do pacote
 * @param prioritizedTopicsPath - Caminho absoluto para o prioritized-topics.json do locale
 * @param minScore - Score mínimo aceitável (default: 50)
 */
export function checkClusterDrift(
  clusterId: string,
  prioritizedTopicsPath: string,
  minScore: number = DEFAULT_MIN_PRIORITY_SCORE,
): ClusterDriftResult {
  // Arquivo não existe → repo virgem, sem base de comparação → sem drift
  if (!fs.existsSync(prioritizedTopicsPath)) {
    return {
      cluster_id: clusterId,
      found: false,
      min_score_threshold: minScore,
      drifted: false,
      reason: null,
    }
  }

  const scores = loadClusterScores(prioritizedTopicsPath)
  const currentScore = scores.get(clusterId)

  // Cluster removido do arquivo de tópicos
  if (currentScore === undefined) {
    return {
      cluster_id: clusterId,
      found: false,
      min_score_threshold: minScore,
      drifted: true,
      reason: `cluster '${clusterId}' ausente de prioritized-topics.json (removido ou renomeado)`,
    }
  }

  // Score abaixo do threshold de viabilidade
  if (currentScore < minScore) {
    return {
      cluster_id: clusterId,
      found: true,
      current_score: currentScore,
      min_score_threshold: minScore,
      drifted: true,
      reason: `cluster '${clusterId}' com priority_score=${currentScore} abaixo do threshold=${minScore}`,
    }
  }

  // Cluster saudável
  return {
    cluster_id: clusterId,
    found: true,
    current_score: currentScore,
    min_score_threshold: minScore,
    drifted: false,
    reason: null,
  }
}

// ---------------------------------------------------------------------------
// Batch helpers
// ---------------------------------------------------------------------------

export interface BatchDriftEntry {
  equivalenceId: string
  cluster_id: string
  locales_present: string[]
}

/**
 * Verifica drift para múltiplos pacotes em todos os seus locales.
 * Retorna mapa equivalenceId → ClusterDriftResult[] (um por locale).
 *
 * @param packages - Lista de pacotes a verificar
 * @param blogDataPath - Raiz de .claude/blog/data/ (contém subpastas por locale)
 * @param minScore - Score mínimo aceitável
 */
export function batchCheckClusterDrift(
  packages: BatchDriftEntry[],
  blogDataPath: string,
  minScore: number = DEFAULT_MIN_PRIORITY_SCORE,
): Map<string, ClusterDriftResult[]> {
  const results = new Map<string, ClusterDriftResult[]>()

  for (const pkg of packages) {
    const driftResults: ClusterDriftResult[] = []

    for (const locale of pkg.locales_present) {
      const topicsPath = path.join(
        blogDataPath,
        locale,
        'prioritized-topics',
        'prioritized-topics.json',
      )
      driftResults.push(checkClusterDrift(pkg.cluster_id, topicsPath, minScore))
    }

    results.set(pkg.equivalenceId, driftResults)
  }

  return results
}

/**
 * Retorna true se QUALQUER resultado de locale indicar drift.
 */
export function hasDrift(driftResults: ClusterDriftResult[]): boolean {
  return driftResults.some(r => r.drifted)
}

/**
 * Retorna o primeiro motivo de drift encontrado, ou null.
 */
export function driftReason(driftResults: ClusterDriftResult[]): string | null {
  return driftResults.find(r => r.drifted)?.reason ?? null
}
