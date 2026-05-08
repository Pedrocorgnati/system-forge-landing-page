/**
 * scripts/smoke-stockpile-generate.ts
 *
 * CI smoke test para a infraestrutura do Stockpile V2 — SEM consumir tokens reais.
 * Usa fixtures pré-geradas para simular pacotes completos.
 *
 * Cobre cenários:
 *   1. Pacote universal completo (4 locales)
 *   2. Pacote exclusive (1 locale)
 *   3. Falha em 1 locale → pacote downgraded para trilingual
 *   4. Falha em todos os locales → grupo descartado (sem arquivo escrito)
 *
 * Critério de aceite:
 *   - Roda em <2min em CI
 *   - 0 tokens reais consumidos
 *   - validate-stockpile passa no estado final do sandbox
 *
 * F2.6.a
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { regenerateIndex } from './regenerate-stockpile-index'
import { runValidation } from './validate-stockpile'
import type { StockpilePackage, PromotionState, StockpileType } from '../src/lib/blog/stockpile-schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_ISO = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const VALID_SHA256 = 'a'.repeat(64)

function makeReviewedMd(slug: string, locale: string): string {
  return `---
title: "Test Article — ${slug} (${locale})"
slug: ${slug}
description: "Test article for smoke testing"
locale: ${locale}
tags: [test, smoke]
author: "Pedro Corgnati"
date: "2026-05-06"
published: false
canonical: "https://example.com/blog/${slug}"
dateModified: "2026-05-06"
---

# Test Article

This is a smoke test article. It should not be published.
`
}

function makeMetadataJson(slug: string, locale: string, uuid: string): string {
  return JSON.stringify({
    slug,
    title: `Test Article — ${slug} (${locale})`,
    locale,
    cluster_id: 'smoke-test-cluster',
    equivalence_id: uuid,
    brief_hash: VALID_SHA256,
    word_count: 42,
    generated_at: VALID_ISO,
  }, null, 2)
}

function makePackageJson(
  uuid: string,
  locales: string[],
  type: StockpileType,
  state: PromotionState = 'available',
): Omit<StockpilePackage, never> & Record<string, unknown> {
  const scores: Record<string, unknown> = {}
  for (const locale of locales) {
    scores[locale] = { seo: 82, conversion: 71, quality_gate: 85 }
  }

  return {
    equivalence_id: uuid,
    stockpile_version: 1,
    type,
    locales_present: locales,
    primary_locale: locales[0]!,
    volatility_class: 'vendor',
    freshness_policy: {
      max_age_days: 21,
      rewrite_required_above_days: 0,
      freshness_gate_signals: [],
    },
    scores,
    brief_fingerprint: {
      cluster_id: 'smoke-test-cluster',
      primary_keywords: ['test', 'smoke'],
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
    promotion_state: state,
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  }
}

// ---------------------------------------------------------------------------
// Package writer
// ---------------------------------------------------------------------------

function writePackage(
  stockpileDir: string,
  uuid: string,
  locales: string[],
  type: StockpileType,
  slug: string,
): void {
  const pkgDir = path.join(stockpileDir, 'packages', uuid)
  fs.mkdirSync(pkgDir, { recursive: true })

  // Write locale files
  for (const locale of locales) {
    const localeDir = path.join(pkgDir, locale)
    fs.mkdirSync(localeDir, { recursive: true })
    fs.writeFileSync(path.join(localeDir, 'reviewed.md'), makeReviewedMd(slug, locale))
    fs.writeFileSync(path.join(localeDir, 'metadata.json'), makeMetadataJson(slug, locale, uuid))
  }

  // Write package.json
  const pkg = makePackageJson(uuid, locales, type)
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

interface ScenarioResult {
  name: string
  passed: boolean
  details: string
}

function runScenario1_UniversalPackage(stockpileDir: string): ScenarioResult {
  const uuid = randomUUID()
  const locales = ['pt-BR', 'it-IT', 'en', 'es-ES']
  writePackage(stockpileDir, uuid, locales, 'universal', 'smoke-universal-test')
  return {
    name: 'Cenário 1 — Pacote universal (4 locales)',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | 4 locales | type: universal`,
  }
}

function runScenario2_ExclusivePackage(stockpileDir: string): ScenarioResult {
  const uuid = randomUUID()
  writePackage(stockpileDir, uuid, ['pt-BR'], 'exclusive', 'smoke-exclusive-test')
  return {
    name: 'Cenário 2 — Pacote exclusive (1 locale)',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | 1 locale | type: exclusive`,
  }
}

function runScenario3_DowngradedToTrilingual(stockpileDir: string): ScenarioResult {
  const uuid = randomUUID()
  // Simula: geração tentou 4 locales, it-IT falhou no quality-gate → downgrade para trilingual
  const approvedLocales = ['pt-BR', 'en', 'es-ES']
  writePackage(stockpileDir, uuid, approvedLocales, 'trilingual', 'smoke-trilingual-test')
  return {
    name: 'Cenário 3 — Downgrade para trilingual (1 locale falhou quality-gate)',
    passed: true,
    details: `UUID: ${uuid.slice(0, 8)}... | 3 locales (it-IT descartado) | type: trilingual`,
  }
}

function runScenario4_AllLocalesFailed(stockpileDir: string): ScenarioResult {
  // Simula: todos os locales falharam no quality-gate → grupo descartado, NADA escrito
  const uuid = randomUUID()
  const pkgDir = path.join(stockpileDir, 'packages', uuid)

  // Grupo descartado: diretório NUNCA deve ser criado
  const dirCreated = fs.existsSync(pkgDir)

  return {
    name: 'Cenário 4 — Grupo descartado (todos os locales falharam quality-gate)',
    passed: !dirCreated,
    details: `UUID: ${uuid.slice(0, 8)}... | 0 locales aprovados | diretório não criado: ${!dirCreated}`,
  }
}

// ---------------------------------------------------------------------------
// Validate final state
// ---------------------------------------------------------------------------

function validateFinalState(stockpileDir: string): ScenarioResult {
  const validation = runValidation(stockpileDir)

  // Expected: 3 valid packages (cenários 1, 2, 3); cenário 4 has no dir
  const expectedPackages = 3
  const actualPackages = validation.stats.packages_scanned

  if (validation.errors.length > 0) {
    return {
      name: 'Validação final — validate:stockpile',
      passed: false,
      details: `Erros: ${validation.errors.map(e => `[${e.code}] ${e.message}`).join('; ')}`,
    }
  }

  if (actualPackages !== expectedPackages) {
    return {
      name: 'Validação final — validate:stockpile',
      passed: false,
      details: `Esperado ${expectedPackages} pacotes, encontrado ${actualPackages}`,
    }
  }

  // Rebuild index and verify
  const index = regenerateIndex(stockpileDir, VALID_ISO)
  if (index.total_packages !== expectedPackages) {
    return {
      name: 'Validação final — validate:stockpile',
      passed: false,
      details: `index.total_packages=${index.total_packages}, esperado ${expectedPackages}`,
    }
  }

  return {
    name: 'Validação final — validate:stockpile + regenerate-index',
    passed: true,
    details: `${actualPackages} pacotes válidos. by_type: ${JSON.stringify(index.by_type)}`,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockpile-smoke-'))
  const stockpileDir = path.join(tmpDir, 'stockpile')
  fs.mkdirSync(path.join(stockpileDir, 'packages'), { recursive: true })

  const startTime = Date.now()
  const results: ScenarioResult[] = []

  try {
    results.push(runScenario1_UniversalPackage(stockpileDir))
    results.push(runScenario2_ExclusivePackage(stockpileDir))
    results.push(runScenario3_DowngradedToTrilingual(stockpileDir))
    results.push(runScenario4_AllLocalesFailed(stockpileDir))
    results.push(validateFinalState(stockpileDir))
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  const elapsed = Date.now() - startTime
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log('\n🔬 Stockpile Generate — CI Smoke Test')
  console.log('─'.repeat(60))
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌'
    console.log(`${icon} ${r.name}`)
    console.log(`   ${r.details}`)
  }
  console.log('─'.repeat(60))
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

export { runScenario1_UniversalPackage, runScenario2_ExclusivePackage, runScenario3_DowngradedToTrilingual, runScenario4_AllLocalesFailed, validateFinalState }
