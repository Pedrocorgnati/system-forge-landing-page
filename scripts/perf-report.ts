#!/usr/bin/env tsx
/**
 * scripts/perf-report.ts
 * Consolida resultados Lighthouse CI por locale e atualiza docs/PERFORMANCE-REPORT.md
 *
 * Uso: npx tsx scripts/perf-report.ts [--artifacts-dir=./lighthouse-results]
 *
 * No CI: os artifacts são baixados antes de executar este script.
 * Artifact names esperados:
 *   lighthouse-results-br/  (locale pt-BR)
 *   lighthouse-results-it/  (locale it-IT)
 *   lighthouse-results-en/  (locale en)
 */

import fs from 'fs'
import path from 'path'

interface LighthouseResult {
  locale: string
  performance: number
  accessibility: number
  seo: number
  lcp: number    // ms
  cls: number
  inp: number    // ms (Interaction to Next Paint)
}

function parseArtifact(artifactPath: string, locale: string): LighthouseResult | null {
  try {
    if (!fs.existsSync(artifactPath)) return null
    const files = fs.readdirSync(artifactPath).filter(f => f.endsWith('.json'))
    if (files.length === 0) return null

    const data = JSON.parse(fs.readFileSync(path.join(artifactPath, files[0]), 'utf-8'))

    return {
      locale,
      performance: Math.round((data.categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((data.categories?.accessibility?.score ?? 0) * 100),
      seo: Math.round((data.categories?.seo?.score ?? 0) * 100),
      lcp: Math.round(data.audits?.['largest-contentful-paint']?.numericValue ?? 0),
      cls: parseFloat(((data.audits?.['cumulative-layout-shift']?.numericValue) ?? 0).toFixed(3)),
      inp: Math.round(data.audits?.['interaction-to-next-paint']?.numericValue ?? 0),
    }
  } catch (e) {
    console.warn(`⚠️  Não foi possível ler artifact para ${locale}: ${e}`)
    return null
  }
}

function scoreStatus(value: number, threshold: number): string {
  return value >= threshold ? `✅ ${value}` : `❌ ${value}`
}

function msStatus(valueMs: number, thresholdMs: number): string {
  const s = (valueMs / 1000).toFixed(1)
  return valueMs <= thresholdMs ? `✅ ${s}s` : `❌ ${s}s`
}

function clsStatus(value: number, threshold: number): string {
  return value <= threshold ? `✅ ${value.toFixed(3)}` : `❌ ${value.toFixed(3)}`
}

const artifactsDir = process.argv.find(a => a.startsWith('--artifacts-dir='))?.split('=')[1] ?? './lighthouse-results'
const localeMap = [
  { key: 'br', label: 'BR (pt-BR)' },
  { key: 'it', label: 'IT (it-IT)' },
  { key: 'en', label: 'EN' },
]

const results = localeMap
  .map(({ key, label }) => parseArtifact(path.join(artifactsDir, `lighthouse-results-${key}`), label))
  .filter(Boolean) as LighthouseResult[]

if (results.length === 0) {
  console.error('❌ Nenhum resultado Lighthouse encontrado.')
  console.error(`   Caminho procurado: ${path.resolve(artifactsDir)}`)
  console.error('   Execute Lighthouse CI primeiro ou forneça --artifacts-dir=<caminho>')
  process.exit(1)
}

const colHeaders = results.map(r => r.locale).join(' | ')
const colSep = results.map(() => '---').join('|')

const table = `
## Resultados por Domínio

| Métrica | ${colHeaders} | Threshold |
|---------|${colSep}|-----------|
| Performance | ${results.map(r => scoreStatus(r.performance, 90)).join(' | ')} | ≥ 90 |
| Accessibility | ${results.map(r => scoreStatus(r.accessibility, 90)).join(' | ')} | ≥ 90 |
| SEO | ${results.map(r => scoreStatus(r.seo, 95)).join(' | ')} | ≥ 95 |
| LCP | ${results.map(r => msStatus(r.lcp, 2500)).join(' | ')} | ≤ 2.5s |
| CLS | ${results.map(r => clsStatus(r.cls, 0.1)).join(' | ')} | ≤ 0.1 |
| INP | ${results.map(r => msStatus(r.inp, 200)).join(' | ')} | ≤ 200ms |

_Atualizado em: ${new Date().toISOString().split('T')[0]}_
`

console.log(table)

// Atualizar PERFORMANCE-REPORT.md
const reportPath = path.join(process.cwd(), 'docs', 'PERFORMANCE-REPORT.md')
if (fs.existsSync(reportPath)) {
  let content = fs.readFileSync(reportPath, 'utf-8')
  // Substituir seção "Resultados por Domínio" ou appender se não existir
  const sectionRegex = /## Resultados por Domínio[\s\S]*?(?=\n## |\z)/
  if (sectionRegex.test(content)) {
    content = content.replace(sectionRegex, table.trimStart() + '\n\n')
  } else {
    content += '\n' + table
  }
  fs.writeFileSync(reportPath, content)
  console.log('✅ docs/PERFORMANCE-REPORT.md atualizado')
} else {
  console.warn('⚠️  docs/PERFORMANCE-REPORT.md não encontrado. Crie o arquivo primeiro.')
}
