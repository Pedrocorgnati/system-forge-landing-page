#!/usr/bin/env tsx
/**
 * scripts/check-content-parity.ts
 * Verifica paridade de conteúdo entre os 4 locales.
 * Falha com exit 1 se paridade quebrada.
 *
 * Uso: npx tsx scripts/check-content-parity.ts
 * INT-001..005 — module-14-integration / TASK-1
 */
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const LOCALES = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const

const CONTENT_FILES = [
  'messages.json',
  'services.json',
  'portfolio.json',
  'testimonials.json',
  'hero.json',
  'about.json',
  'advisor.json',
  'privacy.json',
  'contact.json',
  'faq.json',
] as const

let errors = 0
const errorMessages: string[] = []

function recordError(msg: string): void {
  console.error(`❌ ${msg}`)
  errorMessages.push(msg)
  errors++
}

// ─── Verificar existência dos 30 arquivos ────────────────────────────────────

console.log('\n━━━ Verificando existência dos arquivos (10 × 3 locales) ━━━')

for (const locale of LOCALES) {
  for (const file of CONTENT_FILES) {
    const filePath = path.join('content', locale, 'pages', file)
    if (!existsSync(filePath)) {
      recordError(`MISSING: ${filePath}`)
    }
  }
}

const filesMissing = errors
if (filesMissing === 0) {
  console.log('✅ 30 arquivos presentes')
} else {
  console.error(`❌ ${filesMissing} arquivos ausentes — abortando verificações de paridade`)
  process.exit(1)
}

// ─── Portfolio: paridade de IDs ──────────────────────────────────────────────

console.log('\n━━━ Portfolio: paridade de IDs ━━━')

interface PortfolioItem { id: string; categories?: string[]; technologies?: string[] }

function loadArray<T>(locale: string, file: string): T[] {
  const filePath = path.join('content', locale, 'pages', file)
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'))
  // Suporta tanto array direto quanto objeto com chave homônima ao arquivo
  if (Array.isArray(raw)) return raw as T[]
  const key = file.replace('.json', '')
  if (Array.isArray(raw[key])) return raw[key] as T[]
  // Tenta primeira chave que seja array
  const firstArrayKey = Object.keys(raw).find(k => Array.isArray(raw[k]))
  if (firstArrayKey) return raw[firstArrayKey] as T[]
  return raw as T[]
}

const portfolioByLocale = LOCALES.map(locale => ({
  locale,
  items: loadArray<PortfolioItem>(locale, 'portfolio.json'),
}))

const basePortfolioIds = portfolioByLocale[0].items.map(p => p.id).sort()
console.log(`  pt-BR: ${basePortfolioIds.length} projetos`)

for (const { locale, items } of portfolioByLocale.slice(1)) {
  const ids = items.map(p => p.id).sort()
  console.log(`  ${locale}: ${ids.length} projetos`)
  const missing = basePortfolioIds.filter(id => !ids.includes(id))
  const extra = ids.filter(id => !basePortfolioIds.includes(id))
  if (missing.length > 0) recordError(`Portfolio ${locale} IDs faltando: ${missing.join(', ')}`)
  if (extra.length > 0) recordError(`Portfolio ${locale} IDs extras: ${extra.join(', ')}`)
}

if (errors === filesMissing) {
  console.log(`✅ Portfolio IDs: paridade OK (${basePortfolioIds.length} projetos × 3 locales)`)
}

// ─── Serviços: paridade de IDs ───────────────────────────────────────────────

console.log('\n━━━ Serviços: paridade de IDs de categoria ━━━')

interface ServiceItem { id: string }

const servicesByLocale = LOCALES.map(locale => ({
  locale,
  items: loadArray<ServiceItem>(locale, 'services.json'),
}))

const baseServiceIds = servicesByLocale[0].items.map(s => s.id).sort()
console.log(`  pt-BR: ${servicesByLocale[0].items.length} categorias`)

if (servicesByLocale[0].items.length !== 12) {
  console.warn(`⚠️  services.json pt-BR tem ${servicesByLocale[0].items.length} categorias (esperado 12)`)
}

for (const { locale, items } of servicesByLocale.slice(1)) {
  console.log(`  ${locale}: ${items.length} categorias`)
  if (items.length !== 12) {
    console.warn(`⚠️  services.json ${locale} tem ${items.length} categorias (esperado 12)`)
  }
  const ids = items.map(s => s.id).sort()
  const missing = baseServiceIds.filter(id => !ids.includes(id))
  if (missing.length > 0) {
    recordError(`Services ${locale} IDs de categoria faltando: ${missing.join(', ')}`)
  }
}

if (errors === filesMissing) {
  console.log(`✅ Services IDs: paridade OK (${baseServiceIds.length} categorias × 3 locales)`)
}

// ─── Testimonials: count ──────────────────────────────────────────────────────

console.log('\n━━━ Testimonials: count ━━━')

interface TestimonialItem { id: string }

for (const locale of LOCALES) {
  const items = loadArray<TestimonialItem>(locale, 'testimonials.json')
  console.log(`  ${locale}: ${items.length} depoimentos`)
  if (items.length !== 6) {
    console.warn(`⚠️  testimonials.json ${locale} tem ${items.length} items (esperado 6) — warning, não blocking`)
  }
}

// ─── Resumo ───────────────────────────────────────────────────────────────────

console.log('\n━━━ Resumo ━━━')
if (errors > 0) {
  console.error(`\n❌ ${errors} erro(s) de paridade encontrados:`)
  errorMessages.forEach(m => console.error(`  • ${m}`))
  process.exit(1)
}
console.log(`✅ Content parity OK — 30 arquivos presentes, ${basePortfolioIds.length} portfolio IDs íntegros, ${baseServiceIds.length} service IDs íntegros`)
process.exit(0)
