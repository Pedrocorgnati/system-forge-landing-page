/**
 * scripts/regenerate-stockpile-index.ts
 *
 * Regenera `index.json` a partir dos package.json físicos em packages/.
 * O index é DERIVADO — nunca é fonte de verdade. Reconstruível a qualquer momento.
 *
 * Uso:
 *   npx tsx scripts/regenerate-stockpile-index.ts            # dry-run (imprime JSON)
 *   npx tsx scripts/regenerate-stockpile-index.ts --write    # escreve index.json
 *   npx tsx scripts/regenerate-stockpile-index.ts --dir path # diretório customizado
 *
 * Idempotente: rodar N vezes consecutivas produz output idêntico.
 *
 * F1.3 — critério de aceite: 2 runs consecutivas = output idêntico; 0 pacotes = { packages: [], ... }
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { readAndUpgradePackage } from '../src/lib/blog/stockpile-schema-upgrader'
import type { StockpileIndex, StockpileIndexEntry, PromotionState, StockpileType } from '../src/lib/blog/stockpile-schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..')
const DEFAULT_STOCKPILE_DIR = path.join(REPO_ROOT, '.claude', 'blog', 'data', 'stockpile')

const WRITE = process.argv.includes('--write')
const dirArgIdx = process.argv.indexOf('--dir')
const STOCKPILE_DIR =
  dirArgIdx !== -1 && process.argv[dirArgIdx + 1]
    ? path.resolve(process.argv[dirArgIdx + 1]!)
    : DEFAULT_STOCKPILE_DIR

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

export function regenerateIndex(stockpileDir: string, generatedAt?: string): StockpileIndex {
  const packagesDir = path.join(stockpileDir, 'packages')
  const entries: StockpileIndexEntry[] = []

  if (fs.existsSync(packagesDir)) {
    const dirs = fs.readdirSync(packagesDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort()  // deterministic order

    for (const dirName of dirs) {
      const pkgPath = path.join(packagesDir, dirName, 'package.json')
      if (!fs.existsSync(pkgPath)) continue

      try {
        const pkg = readAndUpgradePackage(pkgPath)
        entries.push({
          equivalence_id: pkg.equivalence_id,
          type: pkg.type,
          locales_present: pkg.locales_present,
          promotion_state: pkg.promotion_state,
          volatility_class: pkg.volatility_class,
          quality_gated_at: pkg.lifecycle.quality_gated_at,
          freshness_checked_at: pkg.lifecycle.freshness_checked_at,
        })
      } catch {
        // Pacotes inválidos são ignorados no index (validate-stockpile reporta os erros)
      }
    }
  }

  // Compute by_state and by_type counts
  const by_state = {
    available: 0,
    locked: 0,
    invalidated: 0,
    quarantine: 0,
  } as Record<PromotionState, number>

  const by_type = {
    exclusive: 0,
    bilingual: 0,
    trilingual: 0,
    universal: 0,
  } as Record<StockpileType, number>

  for (const e of entries) {
    by_state[e.promotion_state] = (by_state[e.promotion_state] ?? 0) + 1
    by_type[e.type] = (by_type[e.type] ?? 0) + 1
  }

  return {
    generated_at: generatedAt ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    total_packages: entries.length,
    by_state,
    by_type,
    packages: entries,
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === __filename) {
  const index = regenerateIndex(STOCKPILE_DIR)
  const json = JSON.stringify(index, null, 2)

  if (WRITE) {
    const indexPath = path.join(STOCKPILE_DIR, 'index.json')
    fs.writeFileSync(indexPath, json + '\n', 'utf8')
    console.log(`✅ index.json escrito: ${indexPath}`)
    console.log(`   ${index.total_packages} pacotes indexados`)
  } else {
    console.log(json)
    console.log('\n[dry-run] Use --write para persistir.')
  }
}
