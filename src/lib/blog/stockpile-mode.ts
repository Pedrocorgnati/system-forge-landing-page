/**
 * src/lib/blog/stockpile-mode.ts
 *
 * F5.2.a — Lógica canônica de seleção de modo (promote_only vs generate) do Stockpile.
 *
 * Esta função é a fonte de verdade para a decisão de modo usada por:
 *  - auto-flow.md Step 0.5 (execução local)
 *  - blog-daily.md Step 0.5 (routine cloud)
 *
 * Ambos os caminhos devem produzir output idêntico para o mesmo estado de stockpile.
 * O golden test F5.2.a verifica isso com 5 fixtures.
 *
 * Spec: scheduled-updates/auto-blog/STOCKPILE-FEATURE.md — F5.2.a
 */

import fs from 'fs'
import path from 'path'
import type { PromotionState } from './stockpile-schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModeDecision = 'promote_only' | 'generate'

export interface StockpileModeResult {
  /** Modo decidido: promote_only se estoque suficiente, generate caso contrário */
  mode_used: ModeDecision
  /** Número de pacotes com promotion_state == 'available' */
  available_count: number
  /** Threshold mínimo para ativar promote_only */
  min_groups: number
  /** Motivo legível da decisão */
  decision_reason: string
  /**
   * Lista de equivalence_ids disponíveis para promoção (ordenados por quality_gated_at ASC).
   * Vazio se mode_used == 'generate'.
   */
  promotable_ids: string[]
}

export interface PackageSummary {
  equivalence_id: string
  promotion_state: PromotionState
  quality_gated_at: string | null
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Determina se o pipeline deve rodar em modo `promote_only` ou `generate`.
 *
 * @param stockpileDir - Caminho absoluto para .claude/blog/data/stockpile
 * @param minGroupsForPromoteOnly - Threshold (config.stockpile.min_groups_for_promote_only)
 * @param allowPromoteOnlyMode - Flag (config.stockpile.allow_promote_only_mode)
 */
export function getStockpileMode(
  stockpileDir: string,
  minGroupsForPromoteOnly: number,
  allowPromoteOnlyMode: boolean,
): StockpileModeResult {
  // Flag desabilitada → sempre generate
  if (!allowPromoteOnlyMode) {
    return {
      mode_used: 'generate',
      available_count: 0,
      min_groups: minGroupsForPromoteOnly,
      decision_reason: 'allow_promote_only_mode=false em config — sempre generate',
      promotable_ids: [],
    }
  }

  const packagesDir = path.join(stockpileDir, 'packages')

  // Diretório não existe → generate (estoque vazio)
  if (!fs.existsSync(packagesDir)) {
    return {
      mode_used: 'generate',
      available_count: 0,
      min_groups: minGroupsForPromoteOnly,
      decision_reason: `Diretório packages/ não existe em ${stockpileDir}`,
      promotable_ids: [],
    }
  }

  // Ler todos os packages/ e filtrar available
  const availablePackages: PackageSummary[] = []

  let entries: string[]
  try {
    entries = fs.readdirSync(packagesDir)
  } catch {
    return {
      mode_used: 'generate',
      available_count: 0,
      min_groups: minGroupsForPromoteOnly,
      decision_reason: `Erro ao ler packages/ em ${packagesDir}`,
      promotable_ids: [],
    }
  }

  for (const entry of entries) {
    const pkgPath = path.join(packagesDir, entry, 'package.json')
    if (!fs.existsSync(pkgPath)) continue

    let pkg: Record<string, unknown>
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
    } catch {
      continue
    }

    if (pkg['promotion_state'] === 'available') {
      const lifecycle = pkg['lifecycle'] as Record<string, unknown> | undefined
      availablePackages.push({
        equivalence_id: entry,
        promotion_state: 'available',
        quality_gated_at: typeof lifecycle?.['quality_gated_at'] === 'string'
          ? lifecycle['quality_gated_at']
          : null,
      })
    }
  }

  const availableCount = availablePackages.length

  if (availableCount >= minGroupsForPromoteOnly) {
    // Ordenar por quality_gated_at ASC (mais antigos primeiro — FIFO)
    availablePackages.sort((a, b) => {
      if (!a.quality_gated_at) return 1
      if (!b.quality_gated_at) return -1
      return new Date(a.quality_gated_at).getTime() - new Date(b.quality_gated_at).getTime()
    })

    return {
      mode_used: 'promote_only',
      available_count: availableCount,
      min_groups: minGroupsForPromoteOnly,
      decision_reason: `${availableCount} pacotes disponíveis >= min_groups=${minGroupsForPromoteOnly} → promote_only`,
      promotable_ids: availablePackages.map(p => p.equivalence_id),
    }
  }

  return {
    mode_used: 'generate',
    available_count: availableCount,
    min_groups: minGroupsForPromoteOnly,
    decision_reason: `${availableCount} pacotes disponíveis < min_groups=${minGroupsForPromoteOnly} → generate`,
    promotable_ids: [],
  }
}
