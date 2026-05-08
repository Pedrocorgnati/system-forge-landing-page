/**
 * src/lib/blog/stockpile-config.ts
 *
 * Helper de leitura para o bloco `stockpile.*` de `.claude/blog/config.json`.
 * Usado por scripts CLI (validate-stockpile, stockpile-generate, etc.).
 *
 * F1.0 — bloco stockpile.* em config.json
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const StockpileConfigSchema = z.object({
  enabled: z.boolean(),
  target_groups_per_run: z.number().int().positive(),
  min_groups_for_promote_only: z.number().int().positive(),
  allow_promote_only_mode: z.boolean(),
  enforce_hreflang_pair_in_promote: z.boolean(),
  enforce_hreflang_pair_in_legacy_publish: z.boolean(),
  volatility_default_class: z.enum(['evergreen', 'versioned', 'pricing', 'regulatory', 'vendor', 'trend']),
  freshness_gate_enabled: z.boolean(),
  lock_ttl_minutes: z.number().int().positive(),
  package_lock_ttl_minutes: z.number().int().positive(),
  block_contents_api_for_stockpile: z.boolean(),
  archive_promoted_after_days: z.number().int().min(0),
  // F3.2.b — threshold mínimo de priority_score para considerar um cluster viável
  // Pacotes cujo cluster caiu abaixo deste valor são marcados para re_review na promoção
  cluster_drift_min_priority_score: z.number().int().min(0).max(100).optional().default(50),
})

export type StockpileConfig = z.infer<typeof StockpileConfigSchema>

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

let _cache: StockpileConfig | null = null

/**
 * Lê e valida o bloco `stockpile.*` de `.claude/blog/config.json`.
 * Resultado é cached (leitura única por processo).
 *
 * @param configPath Caminho absoluto para o config.json. Default: resolve via cwd.
 */
export function getStockpileConfig(configPath?: string): StockpileConfig {
  if (_cache) return _cache

  // Node-only — não importar em runtime Next.js (apenas em scripts CLI)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')

  const resolved = configPath ?? path.join(process.cwd(), '.claude', 'blog', 'config.json')

  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(resolved, 'utf8'))
  } catch (err) {
    throw new Error(`[stockpile-config] Não foi possível ler ${resolved}: ${String(err)}`)
  }

  const fullConfig = raw as Record<string, unknown>
  if (!fullConfig.stockpile) {
    throw new Error(`[stockpile-config] Bloco "stockpile" ausente em ${resolved}`)
  }

  const result = StockpileConfigSchema.safeParse(fullConfig.stockpile)
  if (!result.success) {
    const errs = result.error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n')
    throw new Error(`[stockpile-config] Schema inválido em "stockpile.*":\n${errs}`)
  }

  _cache = result.data
  return _cache
}

/** Limpa o cache (útil em testes). */
export function clearStockpileConfigCache(): void {
  _cache = null
}
