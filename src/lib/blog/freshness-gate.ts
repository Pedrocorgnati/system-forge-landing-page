/**
 * src/lib/blog/freshness-gate.ts
 *
 * F4.3 — gate de frescor para promoção de pacotes do stockpile.
 * Baseado em ADR-004 + §3.3 do STOCKPILE-FEATURE.md.
 *
 * Função principal: evaluateFreshness(pkg, now) → { action, reasons }
 *
 * Ações:
 *   'promote'   — pacote está fresco, pode ser promovido
 *   're_review' — pacote exige re-revisão antes de promover (max_age ultrapassado ou sinal ortogonal)
 *   'rewrite'   — pacote exige reescrita (rewrite_required_above_days ultrapassado — futuro, por ora 0)
 *
 * DEC-4: rewrite_required_above_days == 0 → gate de reescrita desativado nesta versão.
 */

import type { StockpilePackage, FreshnessSignal } from './stockpile-schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FreshnessAction = 'promote' | 're_review' | 'rewrite'

export interface FreshnessResult {
  action: FreshnessAction
  reasons: string[]
  age_days: number
  signals_triggered: FreshnessSignal[]
}

// ---------------------------------------------------------------------------
// Main gate function
// ---------------------------------------------------------------------------

/**
 * Evaluates the freshness of a stockpile package and returns the recommended action.
 *
 * @param pkg - StockpilePackage to evaluate
 * @param now - Reference time (Date or ms timestamp). Defaults to Date.now().
 * @param activeSignals - Orthogonal signals detected externally (e.g. pricing drift, broken link)
 */
export function evaluateFreshness(
  pkg: StockpilePackage,
  now: Date | number = Date.now(),
  activeSignals: FreshnessSignal[] = [],
): FreshnessResult {
  const nowMs = now instanceof Date ? now.getTime() : now
  const reasons: string[] = []
  const signalsTriggered: FreshnessSignal[] = []

  const qualityGatedAt = pkg.lifecycle.quality_gated_at
  if (!qualityGatedAt) {
    return {
      action: 'promote',
      reasons: ['quality_gated_at ausente — assumindo freshness ok'],
      age_days: 0,
      signals_triggered: [],
    }
  }

  const qualityGatedMs = new Date(qualityGatedAt).getTime()
  const ageDays = (nowMs - qualityGatedMs) / (24 * 60 * 60 * 1000)
  const policy = pkg.freshness_policy

  // --- Rewrite gate (DEC-4: desativado quando rewrite_required_above_days == 0) ---
  if (policy.rewrite_required_above_days > 0 && ageDays > policy.rewrite_required_above_days) {
    reasons.push(
      `Idade ${ageDays.toFixed(1)}d > rewrite_required_above_days ${policy.rewrite_required_above_days}d`,
    )
    return { action: 'rewrite', reasons, age_days: ageDays, signals_triggered: [] }
  }

  // --- Max age gate (re_review) ---
  if (ageDays > policy.max_age_days) {
    reasons.push(`Idade ${ageDays.toFixed(1)}d > max_age_days ${policy.max_age_days}d`)
    return { action: 're_review', reasons, age_days: ageDays, signals_triggered: [] }
  }

  // --- Orthogonal signals: force re_review even within max_age ---
  // Signals are checked only when they are declared in freshness_gate_signals for this package
  const subscribedSignals = new Set(policy.freshness_gate_signals)
  for (const signal of activeSignals) {
    if (subscribedSignals.has(signal)) {
      signalsTriggered.push(signal)
      reasons.push(`Sinal ortogonal ativo: ${signal}`)
    }
  }

  if (signalsTriggered.length > 0) {
    return { action: 're_review', reasons, age_days: ageDays, signals_triggered: signalsTriggered }
  }

  return { action: 'promote', reasons: [], age_days: ageDays, signals_triggered: [] }
}

// ---------------------------------------------------------------------------
// Batch helper for promote command (F4.1)
// ---------------------------------------------------------------------------

export interface BatchFreshnessResult {
  eligible: StockpilePackage[]
  stale: Array<{ pkg: StockpilePackage; result: FreshnessResult }>
}

/**
 * Evaluates a list of packages and separates them into eligible (promote) vs stale.
 */
export function batchEvaluateFreshness(
  packages: StockpilePackage[],
  now: Date | number = Date.now(),
  activeSignals: FreshnessSignal[] = [],
): BatchFreshnessResult {
  const eligible: StockpilePackage[] = []
  const stale: BatchFreshnessResult['stale'] = []

  for (const pkg of packages) {
    const result = evaluateFreshness(pkg, now, activeSignals)
    if (result.action === 'promote') {
      eligible.push(pkg)
    } else {
      stale.push({ pkg, result })
    }
  }

  return { eligible, stale }
}
