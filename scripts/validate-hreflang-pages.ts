/**
 * scripts/validate-hreflang-pages.ts
 * Valida reciprocidade hreflang em todas as páginas do HTML estático gerado.
 *
 * Para cada rota em ROUTE_SLUGS:
 *   1. Lê o HTML de out-br/{slug}, out-it/{slug}, out-en/{slug}, out-es/{slug}
 *   2. Extrai todas as tags <link rel="alternate" hreflang="..."> do <head>
 *   3. Verifica que cada página contém alternates para os 4 locales + x-default→EN
 *   4. Verifica reciprocidade entre BR, IT, EN, ES
 *   5. Verifica que slugs nativos são usados (não o mesmo slug para todos)
 *
 * Usage:
 *   npx tsx scripts/validate-hreflang-pages.ts
 *
 * Exit codes:
 *   0 — reciprocidade OK em todas as páginas
 *   1 — erros encontrados
 *
 * INT-029, module-12-compliance-seo
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { ROUTE_SLUGS } from '../src/lib/locale-slugs'
import { LOCALE_URLS } from '../config'

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const BUILD_DIRS: Record<string, string> = {
  'pt-BR': 'out-br',
  'it-IT': 'out-it',
  'en': 'out-en',
  'es-ES': 'out-es',
}

const LOCALE_HREFLANG: Record<string, string> = {
  'pt-BR': 'pt-BR',
  'it-IT': 'it',
  'en': 'en',
  'es-ES': 'es',
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface HreflangError {
  page: string
  locale: string
  message: string
}

interface PageResult {
  page: string
  locale: string
  errors: HreflangError[]
}

// ---------------------------------------------------------------------------
// Extrai hreflang links do HTML
// ---------------------------------------------------------------------------

function extractHreflangLinks(html: string): Record<string, string> {
  const links: Record<string, string> = {}
  const regex = /<link[^>]+rel=["']alternate["'][^>]+>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const tag = match[0]
    const hreflangMatch = /hrefLang=["']([^"']+)["']/i.exec(tag) ?? /hreflang=["']([^"']+)["']/i.exec(tag)
    const hrefMatch = /href=["']([^"']+)["']/i.exec(tag)

    if (hreflangMatch && hrefMatch) {
      links[hreflangMatch[1]] = hrefMatch[1]
    }
  }

  return links
}

// ---------------------------------------------------------------------------
// Resolve caminho HTML para uma rota + locale
// ---------------------------------------------------------------------------

function resolveHtmlPath(buildDir: string, slug: string): string {
  // Next.js static export pode gerar /slug.html ou /slug/index.html
  const withExtension = path.join(buildDir, `${slug === '/' ? 'index' : slug.replace(/^\//, '')}.html`)
  const asDirectory = path.join(buildDir, slug === '/' ? 'index.html' : `${slug.replace(/^\//, '')}/index.html`)

  if (fs.existsSync(withExtension)) return withExtension
  if (fs.existsSync(asDirectory)) return asDirectory
  return withExtension // retornar para sinalizar ausência
}

// ---------------------------------------------------------------------------
// Valida uma rota específica
// ---------------------------------------------------------------------------

function validateRoute(routeKey: string): PageResult[] {
  const results: PageResult[] = []

  for (const [locale, buildDirName] of Object.entries(BUILD_DIRS)) {
    const buildDir = path.resolve(process.cwd(), buildDirName)

    if (!fs.existsSync(buildDir)) {
      results.push({
        page: routeKey,
        locale,
        errors: [{
          page: routeKey,
          locale,
          message: `Build output não encontrado: ${buildDirName}/ — rode npm run build:${buildDirName.replace('out-', '')} primeiro`,
        }],
      })
      continue
    }

    const slugs = ROUTE_SLUGS[locale as keyof typeof ROUTE_SLUGS]
    const thisSlug = slugs[routeKey as keyof typeof slugs]
    const htmlPath = resolveHtmlPath(buildDir, thisSlug)
    const errors: HreflangError[] = []

    if (!fs.existsSync(htmlPath)) {
      // Páginas de privacidade podem não existir em todos os locales do mesmo build
      if (routeKey === 'privacy') continue
      results.push({
        page: routeKey,
        locale,
        errors: [{
          page: routeKey,
          locale,
          message: `Arquivo HTML não encontrado: ${htmlPath}`,
        }],
      })
      continue
    }

    const html = fs.readFileSync(htmlPath, 'utf-8')
    const hreflangLinks = extractHreflangLinks(html)

    // Verificar que todos os 4 locales têm alternate
    for (const [targetLocale, targetBuildDir] of Object.entries(BUILD_DIRS)) {
      const targetSlugs = ROUTE_SLUGS[targetLocale as keyof typeof ROUTE_SLUGS]
      const targetSlug = targetSlugs[routeKey as keyof typeof targetSlugs]
      const targetDomain = LOCALE_URLS[targetLocale as keyof typeof LOCALE_URLS]
      const expectedHref = `${targetDomain}${targetSlug}`
      const hreflangKey = LOCALE_HREFLANG[targetLocale]
      const actualHref = hreflangLinks[hreflangKey]

      if (!actualHref) {
        errors.push({
          page: routeKey,
          locale,
          message: `Missing alternate: hreflang="${hreflangKey}" ausente em ${buildDirName}${thisSlug}`,
        })
        continue
      }

      // Verificar slug nativo (não slug de outro locale)
      if (!actualHref.includes(targetSlug)) {
        errors.push({
          page: routeKey,
          locale,
          message: `hreflang "${hreflangKey}" usa slug incorreto. Esperado: "${targetSlug}", encontrado na URL: "${actualHref}"`,
        })
      }

      // Verificar domínio correto
      if (!actualHref.startsWith(targetDomain)) {
        errors.push({
          page: routeKey,
          locale,
          message: `hreflang "${hreflangKey}" aponta para domínio incorreto. Esperado: "${targetDomain}", encontrado: "${actualHref}"`,
        })
      }

      void expectedHref // used for documentation purposes
    }

    // Verificar x-default → EN
    const xDefault = hreflangLinks['x-default']
    const enDomain = LOCALE_URLS['en']
    if (!xDefault) {
      errors.push({
        page: routeKey,
        locale,
        message: `x-default ausente em ${buildDirName}${thisSlug}`,
      })
    } else if (!xDefault.startsWith(enDomain)) {
      errors.push({
        page: routeKey,
        locale,
        message: `x-default deve apontar para ${enDomain} (EN). Encontrado: "${xDefault}"`,
      })
    }

    results.push({ page: routeKey, locale, errors })
  }

  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('=============================================')
  console.log('  Hreflang Pages Validator — Quad-Market')
  console.log('=============================================\n')

  const allResults: PageResult[] = []

  const routeKeys = Object.keys(ROUTE_SLUGS['pt-BR']) as Array<keyof (typeof ROUTE_SLUGS)['pt-BR']>

  for (const routeKey of routeKeys) {
    const results = validateRoute(routeKey)
    allResults.push(...results)
  }

  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0)
  const report = {
    generatedAt: new Date().toISOString(),
    totalRoutes: routeKeys.length,
    totalErrors,
    results: allResults,
  }

  const reportPath = path.resolve(process.cwd(), 'scripts', 'hreflang-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`Relatório salvo em: ${reportPath}\n`)

  if (totalErrors === 0) {
    console.log(`✅ Reciprocidade hreflang OK em todas as ${routeKeys.length} rotas.\n`)
    process.exit(0)
  }

  console.error(`❌ ${totalErrors} erro(s) de reciprocidade hreflang:\n`)

  for (const result of allResults) {
    if (result.errors.length === 0) continue
    for (const error of result.errors) {
      console.error(`  [${error.locale}] ${error.page}: ${error.message}`)
    }
  }

  console.error('')
  process.exit(1)
}

main()
