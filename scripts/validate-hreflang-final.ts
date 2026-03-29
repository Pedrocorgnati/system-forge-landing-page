#!/usr/bin/env tsx
/**
 * scripts/validate-hreflang-final.ts
 * Validação final de reciprocidade hreflang em todos os HTMLs dos 3 builds.
 * Referência: NEXT-005 guardrail (hreflang-sitemap-reciprocity.md)
 *
 * Uso: npx tsx scripts/validate-hreflang-final.ts
 * INT-022..024 — module-14-integration / TASK-3
 *
 * Gera: docs/HREFLANG-AUDIT.md
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

// ─── Configuração ─────────────────────────────────────────────────────────────

const BUILDS = [
  { outDir: 'dist-br', buildLocale: 'pt-BR', domain: 'forjadesistemas.com.br' },
  { outDir: 'dist-it', buildLocale: 'it-IT', domain: 'systemforge.it' },
  { outDir: 'dist-en', buildLocale: 'en',    domain: 'systemforgesoftware.com' },
  { outDir: 'dist-es', buildLocale: 'es-ES', domain: 'systemforge.es' },
]

const LOCALE_DOMAIN: Record<string, string> = {
  'pt-BR': 'forjadesistemas.com.br',
  'it':    'systemforge.it',
  'it-IT': 'systemforge.it',
  'en':    'systemforgesoftware.com',
  'es':    'systemforge.es',
  'es-ES': 'systemforge.es',
  'x-default': 'systemforgesoftware.com',
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PageIssue {
  file: string
  message: string
  severity: 'error' | 'warning'
}

interface BuildStats {
  pages: number
  hreflangOk: number
  xdefaultOk: number
}

// ─── Extração de hreflang via regex (sem dependência de jsdom) ────────────────

function extractHreflangLinks(html: string): Map<string, string> {
  const links = new Map<string, string>()
  const regex = /<link[^>]*\bhreflang=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>|<link[^>]*\bhref=["']([^"']+)["'][^>]*\bhreflang=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const lang = match[1] ?? match[4]
    const href = match[2] ?? match[3]
    if (lang && href) links.set(lang, href)
  }
  return links
}

// ─── Verificar um arquivo HTML ────────────────────────────────────────────────

function checkHtmlFile(file: string, issues: PageIssue[]): { hreflangOk: boolean; xdefaultOk: boolean } {
  const content = readFileSync(file, 'utf-8')

  // Artigos exclusivos: hreflang cross-domain não esperado
  const isExclusive = content.includes('data-exclusive="true"') || content.includes('"exclusive":true')

  const hreflangMap = extractHreflangLinks(content)

  if (hreflangMap.size === 0) {
    // Página sem hreflang — pode ser intencional (ex: 404, páginas de erro)
    return { hreflangOk: true, xdefaultOk: true }
  }

  if (isExclusive && hreflangMap.size > 1) {
    issues.push({ file, message: 'Artigo exclusivo com hreflang cross-domain (deve ter apenas self-reference)', severity: 'error' })
    return { hreflangOk: false, xdefaultOk: false }
  }

  let hreflangOk = true
  let xdefaultOk = true

  // Verificar domínio por locale
  for (const [lang, href] of hreflangMap.entries()) {
    if (lang === 'x-default') {
      if (!href.includes(LOCALE_DOMAIN['x-default'])) {
        issues.push({ file, message: `x-default aponta para domínio errado: "${href}" (esperado: ${LOCALE_DOMAIN['x-default']})`, severity: 'error' })
        xdefaultOk = false
      }
      continue
    }
    const expectedDomain = LOCALE_DOMAIN[lang]
    if (expectedDomain && !href.includes(expectedDomain)) {
      issues.push({ file, message: `hreflang "${lang}" aponta para domínio errado: "${href}" (esperado: ${expectedDomain})`, severity: 'error' })
      hreflangOk = false
    }
  }

  // x-default obrigatório se houver hreflang
  if (!hreflangMap.has('x-default')) {
    issues.push({ file, message: 'hreflang presente mas x-default ausente', severity: 'warning' })
    xdefaultOk = false
  }

  return { hreflangOk, xdefaultOk }
}

// ─── Reciprocidade Cross-Build ────────────────────────────────────────────────

/**
 * Constrói mapa global de hreflang por URL relativa por build.
 * Depois verifica que se build A declara hreflang para build B,
 * build B reciproca com hreflang apontando para build A.
 */
function validateCrossBuildReciprocity(issues: PageIssue[]): void {
  // Mapa: outDir → relativePath → Map<hreflangLocale, hrefURL>
  const hreflangByBuild = new Map<string, Map<string, Map<string, string>>>()

  for (const { outDir } of BUILDS) {
    const pageMap = new Map<string, Map<string, string>>()
    const htmlFiles = globSync(`${outDir}/**/*.html`)
    for (const file of htmlFiles) {
      const content = readFileSync(file, 'utf-8')
      const isExclusive = content.includes('data-exclusive="true"') || content.includes('"exclusive":true')
      if (isExclusive) continue // skip exclusive articles
      const links = extractHreflangLinks(content)
      if (links.size > 0) {
        const relPath = file.replace(outDir, '').replace(/\/index\.html$/, '/').replace(/\.html$/, '/')
        pageMap.set(relPath, links)
      }
    }
    hreflangByBuild.set(outDir, pageMap)
  }

  // Para cada build, verificar que targets reciprocam
  for (const sourceB of BUILDS) {
    const sourcePages = hreflangByBuild.get(sourceB.outDir)
    if (!sourcePages) continue

    for (const [relPath, hreflangMap] of sourcePages) {
      for (const [lang, href] of hreflangMap) {
        if (lang === 'x-default') continue

        // Encontrar o build target correspondente ao locale
        const targetBuild = BUILDS.find(b => href.includes(b.domain))
        if (!targetBuild) continue
        if (targetBuild.outDir === sourceB.outDir) continue // self-reference

        const targetPages = hreflangByBuild.get(targetBuild.outDir)
        if (!targetPages) {
          issues.push({
            file: `${sourceB.outDir}${relPath}index.html`,
            message: `hreflang "${lang}" → ${href} mas build ${targetBuild.outDir} não tem páginas com hreflang`,
            severity: 'warning',
          })
          continue
        }

        // Extrair path relativo do href
        const targetUrl = new URL(href)
        const targetRelPath = targetUrl.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '/')

        const targetHreflang = targetPages.get(targetRelPath)
        if (!targetHreflang) continue // target page may not have hreflang (ok if page not found)

        // Verificar que o target reciproca com hreflang apontando para source
        const sourceLocaleKeys = Object.entries(LOCALE_DOMAIN)
          .filter(([, d]) => d === sourceB.domain)
          .map(([l]) => l)

        const hasReciprocal = sourceLocaleKeys.some(locKey => {
          const reciprocal = targetHreflang.get(locKey)
          return reciprocal && reciprocal.includes(sourceB.domain)
        })

        if (!hasReciprocal) {
          issues.push({
            file: `${sourceB.outDir}${relPath}index.html`,
            message: `Reciprocidade ausente: declara hreflang "${lang}" → ${targetBuild.domain}${targetRelPath} mas ${targetBuild.outDir}${targetRelPath} não reciproca para ${sourceB.domain}`,
            severity: 'error',
          })
        }
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  console.log('=============================================')
  console.log('  Hreflang Final Validator — Triple-Market')
  console.log('=============================================\n')

  // Verificar builds
  const missingBuilds = BUILDS.filter(b => !existsSync(b.outDir))
  if (missingBuilds.length > 0) {
    console.error(`❌ Builds ausentes: ${missingBuilds.map(b => b.outDir).join(', ')}`)
    console.error('   Execute: npm run build:br && npm run build:it && npm run build:en')
    process.exit(1)
  }

  const allIssues: PageIssue[] = []
  const statsByBuild: Record<string, BuildStats> = {}
  let totalPages = 0

  for (const { outDir, domain } of BUILDS) {
    const htmlFiles = globSync(`${outDir}/**/*.html`)
    const stats: BuildStats = { pages: htmlFiles.length, hreflangOk: 0, xdefaultOk: 0 }
    totalPages += htmlFiles.length

    console.log(`\nVerificando ${outDir} (${domain}) — ${htmlFiles.length} páginas...`)

    for (const file of htmlFiles) {
      const { hreflangOk, xdefaultOk } = checkHtmlFile(file, allIssues)
      if (hreflangOk) stats.hreflangOk++
      if (xdefaultOk) stats.xdefaultOk++
    }

    console.log(`  Hreflang OK: ${stats.hreflangOk}/${stats.pages}`)
    console.log(`  x-default OK: ${stats.xdefaultOk}/${stats.pages}`)
    statsByBuild[outDir] = stats
  }

  // Reciprocidade cross-build
  console.log('\n━━━ Validação de reciprocidade cross-build ━━━')
  validateCrossBuildReciprocity(allIssues)

  // Relatório
  const errors = allIssues.filter(i => i.severity === 'error').length
  const warnings = allIssues.filter(i => i.severity === 'warning').length

  console.log(`\n━━━ Resultado ━━━`)
  console.log(`Pages verificadas: ${totalPages}`)
  if (allIssues.length > 0) {
    allIssues.forEach(i => {
      const prefix = i.severity === 'error' ? '❌' : '⚠️'
      console.log(`${prefix} ${path.relative(process.cwd(), i.file)}: ${i.message}`)
    })
  }

  // Gerar docs/HREFLANG-AUDIT.md
  mkdirSync('docs', { recursive: true })
  const timestamp = new Date().toISOString().split('T')[0]
  const verdict = errors === 0 ? 'APROVADO ✅' : 'REPROVADO ❌'

  const reportLines = [
    '# Hreflang Audit Report',
    `Generated: ${timestamp}`,
    '',
    '## Summary',
    `- Total pages checked: ${totalPages}`,
    `- Errors: ${errors} ${errors === 0 ? '✅' : '❌'}`,
    `- Warnings: ${warnings}`,
    '',
    '## Coverage by Domain',
    '| Domain | Build | Pages | Hreflang OK | x-default OK |',
    '|--------|-------|-------|-------------|--------------|',
  ]

  for (const { outDir, domain } of BUILDS) {
    const s = statsByBuild[outDir]
    if (s) {
      reportLines.push(`| ${domain} | ${outDir} | ${s.pages} | ${s.hreflangOk}/${s.pages} | ${s.xdefaultOk}/${s.pages} |`)
    }
  }

  reportLines.push('', '## Issues')
  if (allIssues.length === 0) {
    reportLines.push('Nenhum — ✅ 100% OK')
  } else {
    allIssues.forEach(i => {
      const prefix = i.severity === 'error' ? '- ❌' : '- ⚠️'
      reportLines.push(`${prefix} \`${path.relative(process.cwd(), i.file)}\`: ${i.message}`)
    })
  }

  reportLines.push('', `## Veredito`, `**${verdict}**`, '')
  writeFileSync('docs/HREFLANG-AUDIT.md', reportLines.join('\n'), 'utf-8')
  console.log('\n📄 Relatório gerado: docs/HREFLANG-AUDIT.md')

  if (errors > 0) {
    console.error(`\n❌ ${errors} erro(s) de hreflang encontrados`)
    process.exit(1)
  }
  console.log(`\n✅ Hreflang validation OK — ${totalPages} páginas verificadas, 0 erros`)
  process.exit(0)
}

main()
