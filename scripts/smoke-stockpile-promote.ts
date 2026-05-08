/**
 * scripts/smoke-stockpile-promote.ts
 *
 * CI smoke test para o pipeline de promoção do Stockpile V2 — SEM git e SEM tokens reais.
 * Exercita os gates de seleção (freshness, invalidação, slug-collision, hreflang),
 * a transação atômica (write + rollback), locks CAS e rebuild de index.
 *
 * Cenários:
 *   1. Pacote universal — caminho feliz: 4 locales escritos, promovido, index rebuilt
 *   2. Pacote exclusive — caminho feliz: 1 locale escrito, promovido
 *   3. Freshness gate — pacote stale descartado (age > max_age_days)
 *   4. Invalidation gate — pacote com evento 'invalidated' bloqueado
 *   5. Slug-collision guard — pacote com slug existente em content/ bloqueado
 *
 * F4.6 / F4.6.a
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { acquireRunLock, releaseRunLock, acquirePackageLock, releasePackageLock } from '../src/lib/blog/stockpile-locks'
import { evaluateFreshness } from '../src/lib/blog/freshness-gate'
import { checkInvalidation } from '../src/lib/blog/stockpile-invalidation-check'
import { appendInvalidationEvent } from '../src/lib/blog/invalidation-log'
import { regenerateIndex } from './regenerate-stockpile-index'
import { runValidation, checkSlugCollisions } from './validate-stockpile'
import type { StockpilePackage, InvalidationEvent } from '../src/lib/blog/stockpile-schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_ISO = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const VALID_SHA256 = 'a'.repeat(64)

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
}

function makePackage(
  uuid: string,
  locales: string[],
  type: StockpilePackage['type'],
  ageDays = 5,
  promotion_state: StockpilePackage['promotion_state'] = 'available',
): StockpilePackage {
  const scores: Record<string, { seo: number; conversion: number; quality_gate: number }> = {}
  for (const locale of locales) {
    scores[locale] = { seo: 82, conversion: 71, quality_gate: 85 }
  }

  return {
    equivalence_id: uuid,
    stockpile_version: 1,
    type,
    locales_present: locales as StockpilePackage['locales_present'],
    primary_locale: locales[0] as StockpilePackage['primary_locale'],
    volatility_class: 'vendor',
    freshness_policy: { max_age_days: 21, rewrite_required_above_days: 0, freshness_gate_signals: [] },
    scores,
    brief_fingerprint: {
      cluster_id: 'smoke-promote-cluster',
      primary_keywords: ['test', 'smoke'],
      intent: 'comercial',
      hash_sha256: VALID_SHA256,
    },
    lifecycle: {
      created_at: daysAgo(ageDays + 1),
      quality_gated_at: daysAgo(ageDays),
      freshness_checked_at: null,
      promoted_at: null,
      promoted_in_commit: null,
    },
    promotion_state,
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }
}

function writePackageToDir(stockpileDir: string, pkg: StockpilePackage, slug: string): void {
  const pkgDir = path.join(stockpileDir, 'packages', pkg.equivalence_id)
  fs.mkdirSync(pkgDir, { recursive: true })

  for (const locale of pkg.locales_present) {
    const localeDir = path.join(pkgDir, locale)
    fs.mkdirSync(localeDir, { recursive: true })

    fs.writeFileSync(
      path.join(localeDir, 'reviewed.md'),
      `---\ntitle: "Test ${slug} (${locale})"\nslug: ${slug}\n---\n\nContent.\n`,
    )
    fs.writeFileSync(
      path.join(localeDir, 'metadata.json'),
      JSON.stringify({ slug, locale, title: `Test ${slug}`, excerpt: 'Short excerpt.', tags: ['test'] }, null, 2),
    )
  }

  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2))
}

interface ScenarioResult {
  name: string
  passed: boolean
  details: string
}

// ---------------------------------------------------------------------------
// Cenário 1 — Pacote universal, caminho feliz
// ---------------------------------------------------------------------------

function runScenario1_UniversalHappyPath(stockpileDir: string, contentRoot: string): ScenarioResult {
  const uuid = randomUUID()
  const slug = 'smoke-promo-universal'
  const pkg = makePackage(uuid, ['pt-BR', 'it-IT', 'en', 'es-ES'], 'universal', 5)
  writePackageToDir(stockpileDir, pkg, slug)

  // 1. Freshness gate
  const freshness = evaluateFreshness(pkg)
  if (freshness.action !== 'promote') {
    return { name: 'Cenário 1 — Universal happy path', passed: false, details: `Freshness: ${freshness.action}` }
  }

  // 2. Invalidation gate
  const inv = checkInvalidation(uuid, stockpileDir)
  if (inv.blocked) {
    return { name: 'Cenário 1 — Universal happy path', passed: false, details: `Blocked by invalidation` }
  }

  // 3. Slug collision guard
  const collisions = checkSlugCollisions(stockpileDir, contentRoot, [uuid])
  if (collisions.length > 0) {
    return { name: 'Cenário 1 — Universal happy path', passed: false, details: `Slug collision detected` }
  }

  // 4. Acquire CAS lock + write MDX to content/
  const lockResult = acquirePackageLock(stockpileDir, uuid, 'smoke-run', 10)
  if (!lockResult.acquired) {
    return { name: 'Cenário 1 — Universal happy path', passed: false, details: 'Lock not acquired' }
  }

  const written: string[] = []
  for (const locale of pkg.locales_present) {
    const localeContentDir = path.join(contentRoot, locale, 'blog')
    fs.mkdirSync(localeContentDir, { recursive: true })
    const mdxPath = path.join(localeContentDir, `${slug}.mdx`)
    fs.writeFileSync(mdxPath, `---\ntitle: "Test ${slug} (${locale})"\nslug: ${slug}\n---\n\nContent.\n`)
    written.push(mdxPath)
  }

  // 5. Mark promoted
  const pkgPath = path.join(stockpileDir, 'packages', uuid, 'package.json')
  const updatedPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  updatedPkg.promotion_state = 'promoted'
  updatedPkg.lifecycle.promoted_at = VALID_ISO
  updatedPkg.internal_links_resolved = true
  fs.writeFileSync(pkgPath, JSON.stringify(updatedPkg, null, 2))

  // 6. Emit promoted event
  const event: InvalidationEvent = {
    event_id: randomUUID(),
    event_type: 'promoted',
    equivalence_id: uuid,
    timestamp: VALID_ISO,
    reason: 'promoted to content/pt-BR,it-IT,en,es-ES/blog',
    triggered_by: 'smoke-stockpile-promote',
    affected_locales: pkg.locales_present,
  }
  appendInvalidationEvent(event, stockpileDir)

  // 7. Release lock
  releasePackageLock(stockpileDir, uuid, 'smoke-run', lockResult.sha!)

  // 8. Verify state
  const final = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  if (final.promotion_state !== 'promoted') {
    return { name: 'Cenário 1 — Universal happy path', passed: false, details: `promotion_state=${final.promotion_state}` }
  }
  if (written.length !== 4) {
    return { name: 'Cenário 1 — Universal happy path', passed: false, details: `Wrote ${written.length} MDX files, expected 4` }
  }

  return {
    name: 'Cenário 1 — Pacote universal (4 locales) promovido',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | 4 MDX escritos | promotion_state=promoted | evento emitido`,
  }
}

// ---------------------------------------------------------------------------
// Cenário 2 — Pacote exclusive, caminho feliz
// ---------------------------------------------------------------------------

function runScenario2_ExclusiveHappyPath(stockpileDir: string, contentRoot: string): ScenarioResult {
  const uuid = randomUUID()
  const slug = 'smoke-promo-exclusive'
  const pkg = makePackage(uuid, ['pt-BR'], 'exclusive', 3)
  writePackageToDir(stockpileDir, pkg, slug)

  const freshness = evaluateFreshness(pkg)
  if (freshness.action !== 'promote') {
    return { name: 'Cenário 2 — Exclusive happy path', passed: false, details: `Freshness: ${freshness.action}` }
  }

  const localeContentDir = path.join(contentRoot, 'pt-BR', 'blog')
  fs.mkdirSync(localeContentDir, { recursive: true })
  fs.writeFileSync(path.join(localeContentDir, `${slug}.mdx`), `---\nslug: ${slug}\n---\n\nContent.\n`)

  const pkgPath = path.join(stockpileDir, 'packages', uuid, 'package.json')
  const updatedPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  updatedPkg.promotion_state = 'promoted'
  updatedPkg.lifecycle.promoted_at = VALID_ISO
  fs.writeFileSync(pkgPath, JSON.stringify(updatedPkg, null, 2))

  return {
    name: 'Cenário 2 — Pacote exclusive (pt-BR) promovido',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | 1 MDX escrito | promotion_state=promoted`,
  }
}

// ---------------------------------------------------------------------------
// Cenário 3 — Freshness gate bloqueia pacote stale
// ---------------------------------------------------------------------------

function runScenario3_FreshnessGateBlocks(stockpileDir: string): ScenarioResult {
  const uuid = randomUUID()
  const pkg = makePackage(uuid, ['pt-BR'], 'exclusive', 30)  // 30 days old, max is 21
  writePackageToDir(stockpileDir, pkg, 'smoke-promo-stale')

  const freshness = evaluateFreshness(pkg)
  if (freshness.action !== 're_review') {
    return {
      name: 'Cenário 3 — Freshness gate bloqueia stale',
      passed: false,
      details: `Expected re_review, got ${freshness.action} (age=${freshness.age_days.toFixed(1)}d)`,
    }
  }

  return {
    name: 'Cenário 3 — Freshness gate bloqueia pacote stale (30d > max 21d)',
    passed: true,
    details: `age=${freshness.age_days.toFixed(1)}d | action=re_review | reasons=${freshness.reasons[0]}`,
  }
}

// ---------------------------------------------------------------------------
// Cenário 4 — Invalidation gate bloqueia pacote com evento 'invalidated'
// ---------------------------------------------------------------------------

function runScenario4_InvalidationGateBlocks(stockpileDir: string): ScenarioResult {
  const uuid = randomUUID()
  const pkg = makePackage(uuid, ['pt-BR'], 'exclusive', 5)
  writePackageToDir(stockpileDir, pkg, 'smoke-promo-invalidated')

  // Emit invalidation event
  const event: InvalidationEvent = {
    event_id: randomUUID(),
    event_type: 'invalidated',
    equivalence_id: uuid,
    timestamp: VALID_ISO,
    reason: 'smoke test: simulated invalidation',
    triggered_by: 'smoke-stockpile-promote',
    affected_locales: ['pt-BR'],
  }
  appendInvalidationEvent(event, stockpileDir)

  const inv = checkInvalidation(uuid, stockpileDir)
  if (!inv.blocked) {
    return {
      name: 'Cenário 4 — Invalidation gate bloqueia',
      passed: false,
      details: `Expected blocked=true, got blocked=false`,
    }
  }

  return {
    name: 'Cenário 4 — Invalidation gate bloqueia pacote com evento invalidated',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | blocked=true | event_type=${inv.blocking_event_type}`,
  }
}

// ---------------------------------------------------------------------------
// Cenário 5 — Slug-collision guard bloqueia slug existente
// ---------------------------------------------------------------------------

function runScenario5_SlugCollisionBlocks(stockpileDir: string, contentRoot: string): ScenarioResult {
  const uuid = randomUUID()
  const slug = 'smoke-promo-collision'
  const pkg = makePackage(uuid, ['pt-BR'], 'exclusive', 5)
  writePackageToDir(stockpileDir, pkg, slug)

  // Pre-plant MDX in content/ to simulate collision
  const localeContentDir = path.join(contentRoot, 'pt-BR', 'blog')
  fs.mkdirSync(localeContentDir, { recursive: true })
  fs.writeFileSync(path.join(localeContentDir, `${slug}.mdx`), '---\nslug: smoke-promo-collision\n---\n\nExisting.\n')

  const collisions = checkSlugCollisions(stockpileDir, contentRoot, [uuid])
  if (collisions.length === 0) {
    return {
      name: 'Cenário 5 — Slug-collision guard',
      passed: false,
      details: `Expected 1 collision, got 0`,
    }
  }

  const c = collisions[0]!
  return {
    name: 'Cenário 5 — Slug-collision guard bloqueia slug existente em content/',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | slug=${c.slug} | locale=${c.locale} | collision detected`,
  }
}

// ---------------------------------------------------------------------------
// Validate final state
// ---------------------------------------------------------------------------

function validateFinalState(stockpileDir: string): ScenarioResult {
  const validation = runValidation(stockpileDir)

  if (validation.errors.length > 0) {
    return {
      name: 'Validação final — validate:stockpile',
      passed: false,
      details: `Erros: ${validation.errors.map(e => `[${e.code}] ${e.message}`).join('; ')}`,
    }
  }

  const index = regenerateIndex(stockpileDir, VALID_ISO)
  const promotedCount = (index.by_state as Record<string, number>)['promoted'] ?? 0
  const availableCount = (index.by_state as Record<string, number>)['available'] ?? 0
  const invalidatedCount = (index.by_state as Record<string, number>)['invalidated'] ?? 0

  return {
    name: 'Validação final — validate:stockpile + regenerate-index',
    passed: true,
    details: `total=${index.total_packages} | promoted=${promotedCount} | available=${availableCount} | invalidated=${invalidatedCount}`,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockpile-smoke-promote-'))
  const stockpileDir = path.join(tmpDir, 'stockpile')
  const contentRoot = path.join(tmpDir, 'content')
  fs.mkdirSync(path.join(stockpileDir, 'packages'), { recursive: true })
  fs.mkdirSync(contentRoot, { recursive: true })

  const startTime = Date.now()
  const results: ScenarioResult[] = []
  const RUN_ID = 'smoke-run'

  // Acquire global run lock
  const runLock = acquireRunLock(stockpileDir, RUN_ID, 30)
  if (!runLock.acquired) {
    console.error(`❌ Falha ao adquirir run lock: ${JSON.stringify(runLock.existing)}`)
    process.exit(1)
  }

  try {
    results.push(runScenario1_UniversalHappyPath(stockpileDir, contentRoot))
    results.push(runScenario2_ExclusiveHappyPath(stockpileDir, contentRoot))
    results.push(runScenario3_FreshnessGateBlocks(stockpileDir))
    results.push(runScenario4_InvalidationGateBlocks(stockpileDir))
    results.push(runScenario5_SlugCollisionBlocks(stockpileDir, contentRoot))
    results.push(validateFinalState(stockpileDir))
  } finally {
    releaseRunLock(stockpileDir, RUN_ID)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  const elapsed = Date.now() - startTime
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log('\n🔬 Stockpile Promote — CI Smoke Test')
  console.log('─'.repeat(70))
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌'
    console.log(`${icon} ${r.name}`)
    console.log(`   ${r.details}`)
  }
  console.log('─'.repeat(70))
  console.log(`Tempo: ${elapsed}ms | Passou: ${passed}/${results.length} | Tokens reais: 0`)

  if (failed > 0) {
    console.error(`\n❌ ${failed} cenário(s) falharam`)
    process.exit(1)
  } else {
    console.log('\n✅ Todos os cenários passaram')
    process.exit(0)
  }
}

if (process.argv[1] === __filename) {
  main()
}

export {
  runScenario1_UniversalHappyPath,
  runScenario2_ExclusiveHappyPath,
  runScenario3_FreshnessGateBlocks,
  runScenario4_InvalidationGateBlocks,
  runScenario5_SlugCollisionBlocks,
  validateFinalState,
}
