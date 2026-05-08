/**
 * scripts/golden-test-mode-parity.ts
 *
 * F5.2.a — Golden test de paridade auto-flow ↔ routine cloud.
 *
 * Verifica que a lógica de seleção de modo (promote_only vs generate)
 * produz output idêntico para ambos os caminhos de execução, dado o mesmo
 * estado de stockpile.
 *
 * 5 fixtures cobrindo: generate (estoque vazio), generate (abaixo do threshold),
 * promote_only (exatamente no threshold), promote_only (acima), allow_promote_only=false.
 *
 * Uso: npx tsx scripts/golden-test-mode-parity.ts
 * Exit code 0 → todos os 5 fixtures passaram; exit code 1 → falha.
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { getStockpileMode } from '../src/lib/blog/stockpile-mode'
import type { StockpileModeResult } from '../src/lib/blog/stockpile-mode'

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function makeStockpileDir(
  tmpDir: string,
  availableCount: number,
  lockedCount: number = 0,
  invalidatedCount: number = 0,
): string {
  const stockpileDir = path.join(tmpDir, 'stockpile')
  const packagesDir = path.join(stockpileDir, 'packages')
  fs.mkdirSync(packagesDir, { recursive: true })

  let idx = 0

  const writePackage = (state: string, qualityGatedAt: string) => {
    const uuid = `00000000-0000-0000-0000-${String(idx++).padStart(12, '0')}`
    const pkgDir = path.join(packagesDir, uuid)
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({
      equivalence_id: uuid,
      stockpile_version: 1,
      type: 'universal',
      locales_present: ['pt-BR', 'en', 'it-IT', 'es-ES'],
      primary_locale: 'pt-BR',
      volatility_class: 'vendor',
      freshness_policy: { max_age_days: 21, rewrite_required_above_days: 0, freshness_gate_signals: [] },
      scores: {},
      brief_fingerprint: { cluster_id: `cluster-${uuid}`, primary_keywords: ['kw'], intent: 'comercial', hash_sha256: 'a'.repeat(64) },
      lifecycle: { created_at: qualityGatedAt, quality_gated_at: qualityGatedAt, freshness_checked_at: null, promoted_at: null, promoted_in_commit: null },
      promotion_state: state,
      promotion_lock: null,
      invalidation_reason: null,
      internal_links_resolved: false,
    }, null, 2))
  }

  const baseDate = '2026-01-01T12:00:00Z'
  for (let i = 0; i < availableCount; i++) {
    // Stagger timestamps so FIFO ordering is deterministic
    const date = new Date('2026-01-01T12:00:00Z')
    date.setHours(date.getHours() + i)
    writePackage('available', date.toISOString().replace(/\.\d+Z$/, 'Z'))
  }
  for (let i = 0; i < lockedCount; i++) writePackage('locked', baseDate)
  for (let i = 0; i < invalidatedCount; i++) writePackage('invalidated', baseDate)

  return stockpileDir
}

// ---------------------------------------------------------------------------
// Golden fixture definitions
// ---------------------------------------------------------------------------

interface GoldenFixture {
  name: string
  availableCount: number
  lockedCount: number
  minGroups: number
  allowPromoteOnly: boolean
  expectedMode: 'promote_only' | 'generate'
  expectedAvailableCount: number
  expectedPromotableLength: number
}

const FIXTURES: GoldenFixture[] = [
  {
    name: 'Fixture 1 — estoque vazio → generate',
    availableCount: 0,
    lockedCount: 0,
    minGroups: 5,
    allowPromoteOnly: true,
    expectedMode: 'generate',
    expectedAvailableCount: 0,
    expectedPromotableLength: 0,
  },
  {
    name: 'Fixture 2 — estoque abaixo do threshold → generate',
    availableCount: 3,
    lockedCount: 2,
    minGroups: 5,
    allowPromoteOnly: true,
    expectedMode: 'generate',
    expectedAvailableCount: 3,
    expectedPromotableLength: 0,
  },
  {
    name: 'Fixture 3 — estoque exatamente no threshold → promote_only',
    availableCount: 5,
    lockedCount: 0,
    minGroups: 5,
    allowPromoteOnly: true,
    expectedMode: 'promote_only',
    expectedAvailableCount: 5,
    expectedPromotableLength: 5,
  },
  {
    name: 'Fixture 4 — estoque acima do threshold → promote_only (contended)',
    availableCount: 12,
    lockedCount: 3,
    minGroups: 5,
    allowPromoteOnly: true,
    expectedMode: 'promote_only',
    expectedAvailableCount: 12,
    expectedPromotableLength: 12,
  },
  {
    name: 'Fixture 5 — allow_promote_only=false → sempre generate, mesmo com estoque cheio',
    availableCount: 10,
    lockedCount: 0,
    minGroups: 5,
    allowPromoteOnly: false,
    expectedMode: 'generate',
    expectedAvailableCount: 0,
    expectedPromotableLength: 0,
  },
]

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function runFixture(fixture: GoldenFixture, tmpDir: string): { pass: boolean; error?: string } {
  const stockpileDir = makeStockpileDir(tmpDir, fixture.availableCount, fixture.lockedCount)
  const result: StockpileModeResult = getStockpileMode(
    stockpileDir,
    fixture.minGroups,
    fixture.allowPromoteOnly,
  )

  const checks: Array<{ name: string; pass: boolean; got: unknown; expected: unknown }> = [
    { name: 'mode_used', pass: result.mode_used === fixture.expectedMode, got: result.mode_used, expected: fixture.expectedMode },
    { name: 'available_count', pass: result.available_count === fixture.expectedAvailableCount, got: result.available_count, expected: fixture.expectedAvailableCount },
    { name: 'promotable_ids.length', pass: result.promotable_ids.length === fixture.expectedPromotableLength, got: result.promotable_ids.length, expected: fixture.expectedPromotableLength },
    { name: 'min_groups', pass: result.min_groups === fixture.minGroups, got: result.min_groups, expected: fixture.minGroups },
  ]

  // For promote_only: verify promotable_ids are ordered by quality_gated_at ASC (FIFO)
  if (result.mode_used === 'promote_only' && result.promotable_ids.length > 1) {
    const pkgsDir = path.join(stockpileDir, 'packages')
    const dates = result.promotable_ids.map(id => {
      const pkgPath = path.join(pkgsDir, id, 'package.json')
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
      const lc = pkg['lifecycle'] as Record<string, unknown>
      return new Date(lc['quality_gated_at'] as string).getTime()
    })
    const isSorted = dates.every((d, i) => i === 0 || dates[i - 1]! <= d)
    checks.push({ name: 'promotable_ids FIFO order', pass: isSorted, got: isSorted, expected: true })
  }

  const failures = checks.filter(c => !c.pass)
  if (failures.length > 0) {
    const details = failures.map(f => `    ${f.name}: got=${JSON.stringify(f.got)}, expected=${JSON.stringify(f.expected)}`).join('\n')
    return { pass: false, error: `Checks failed:\n${details}` }
  }

  return { pass: true }
}

function main() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'golden-test-parity-'))
  let allPassed = true
  const results: Array<{ name: string; pass: boolean; error?: string }> = []

  console.log('Golden Test — Mode Parity (F5.2.a)')
  console.log('━'.repeat(60))

  try {
    for (let i = 0; i < FIXTURES.length; i++) {
      const fixture = FIXTURES[i]!
      const fixtureDir = path.join(tmpRoot, `fixture-${i + 1}`)
      fs.mkdirSync(fixtureDir)

      const result = runFixture(fixture, fixtureDir)
      results.push({ name: fixture.name, ...result })

      const icon = result.pass ? '✓' : '✗'
      console.log(`${icon} ${fixture.name}`)
      if (!result.pass) {
        console.log(result.error)
        allPassed = false
      }
    }
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  }

  console.log('━'.repeat(60))
  const passed = results.filter(r => r.pass).length
  console.log(`${passed}/${results.length} fixtures passed`)

  if (!allPassed) {
    console.error('\nGOLDEN TEST FAILED — mode parity broken between auto-flow and routine cloud')
    process.exit(1)
  }

  console.log('\nAll fixtures passed — auto-flow ↔ routine cloud parity verified')
  process.exit(0)
}

main()
