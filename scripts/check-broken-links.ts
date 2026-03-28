#!/usr/bin/env tsx
/**
 * scripts/check-broken-links.ts
 * Crawl estático dos builds gerados e detecta links quebrados.
 *
 * Verifica links internos (href iniciando com /) — blocking (exit 1).
 * Links externos (http/https) — apenas warnings.
 *
 * Uso:
 *   npx tsx scripts/check-broken-links.ts              # full (inclui links externos)
 *   npx tsx scripts/check-broken-links.ts --internal-only  # somente links internos (CI)
 *
 * INT-025 — module-14-integration / TASK-4
 * Gera: docs/BROKEN-LINKS-AUDIT.md
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'

// ─── Configuração ─────────────────────────────────────────────────────────────

const OUT_DIRS: Record<string, { dir: string; domain: string }> = {
  br: { dir: 'dist-br', domain: 'https://forjadesistemas.com.br' },
  it: { dir: 'dist-it', domain: 'https://systemforge.it' },
  en: { dir: 'dist-en', domain: 'https://systemforgesoftware.com' },
}

// Rotas obrigatórias por locale (from ROUTE_SLUGS)
const EXPECTED_ROUTES: Record<string, string[]> = {
  br: ['/', '/sobre', '/servicos', '/portfolio', '/contato', '/blog', '/privacidade'],
  it: ['/', '/chi-siamo', '/servizi', '/portfolio', '/contatti', '/blog', '/privacy'],
  en: ['/', '/about', '/services', '/portfolio', '/contact', '/blog', '/privacy'],
}

const internalOnly = process.argv.includes('--internal-only')

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BrokenLink {
  file: string
  href: string
  type: 'internal' | 'external'
}

interface LocaleStats {
  total: number
  checked: number
  broken: number
  warnings: number
}

// ─── Extração de links via regex (sem jsdom) ──────────────────────────────────

function extractLinks(html: string): string[] {
  const links: string[] = []
  const regex = /<a[^>]+\bhref=["']([^"'#][^"']*|#[^"']*)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    links.push(match[1])
  }
  return links
}

// ─── Verificar se link interno existe no build ───────────────────────────────

function checkInternalLink(outDir: string, href: string): boolean {
  const cleanHref = href.split('?')[0].split('#')[0].replace(/\/$/, '') || '/index'
  const normalized = cleanHref === '/index' || cleanHref === '' ? '/index' : cleanHref.replace(/^\//, '')

  const candidates = [
    path.join(outDir, `${normalized}.html`),
    path.join(outDir, normalized, 'index.html'),
    path.join(outDir, `${normalized}`),
  ]
  return candidates.some(p => existsSync(p))
}

// ─── Verificar rotas obrigatórias ─────────────────────────────────────────────

function checkRequiredRoutes(locale: string, dir: string): string[] {
  const issues: string[] = []
  const routes = EXPECTED_ROUTES[locale] ?? []
  for (const route of routes) {
    const normalized = route === '/' ? 'index' : route.replace(/^\//, '')
    const htmlPath = path.join(dir, `${normalized}/index.html`)
    const altPath  = path.join(dir, `${normalized}.html`)
    const rootPath = path.join(dir, 'index.html')

    const exists = route === '/'
      ? existsSync(rootPath) || existsSync(htmlPath)
      : existsSync(htmlPath) || existsSync(altPath)

    if (!exists) {
      issues.push(`ROUTE_MISSING: ${locale} → ${route}`)
    }
  }
  return issues
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  console.log('=============================================')
  console.log('  Broken Links Audit — Triple-Market')
  console.log(`  Modo: ${internalOnly ? 'interno apenas (CI)' : 'completo'}`)
  console.log('=============================================\n')

  const allBroken: BrokenLink[] = []
  const statsByLocale: Record<string, LocaleStats> = {}
  let internalErrors = 0
  let externalWarnings = 0
  let routeErrors = 0

  // Verificar builds
  for (const [locale, { dir }] of Object.entries(OUT_DIRS)) {
    if (!existsSync(dir)) {
      console.error(`❌ Build ausente: ${dir}/ — execute npm run build:${locale} primeiro`)
      internalErrors++
    }
  }
  if (internalErrors > 0) {
    console.error('\n❌ Builds ausentes. Abortando.')
    process.exit(1)
  }

  // Verificar links por build
  for (const [locale, { dir, domain }] of Object.entries(OUT_DIRS)) {
    const htmlFiles = globSync(`${dir}/**/*.html`)
    console.log(`\nVerificando ${dir} (${htmlFiles.length} arquivos)...`)

    const stats: LocaleStats = { total: 0, checked: htmlFiles.length, broken: 0, warnings: 0 }

    // Verificar rotas obrigatórias
    const routeIssues = checkRequiredRoutes(locale, dir)
    for (const issue of routeIssues) {
      console.error(`❌ ${issue}`)
      internalErrors++
      routeErrors++
    }

    for (const file of htmlFiles) {
      const content = readFileSync(file, 'utf-8')
      const links = extractLinks(content)

      for (const href of links) {
        // Skip anchor, mailto, tel, javascript
        if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
            href.startsWith('tel:') || href.startsWith('javascript:') ||
            href.startsWith('wa.me') || href.startsWith('whatsapp:')) {
          continue
        }

        stats.total++

        // Link interno
        if (href.startsWith('/')) {
          if (!checkInternalLink(dir, href)) {
            console.error(`❌ BROKEN_INTERNAL: ${path.relative(process.cwd(), file)} → ${href}`)
            allBroken.push({ file, href, type: 'internal' })
            internalErrors++
            stats.broken++
          }
          continue
        }

        // Link externo — apenas em modo full
        if (!internalOnly && (href.startsWith('http://') || href.startsWith('https://'))) {
          // Verificar se é o próprio site (cross-domain bug)
          const isSameSite = Object.values(OUT_DIRS).some(({ domain: d }) =>
            href.includes(d.replace('https://', ''))
          )
          if (isSameSite) {
            const url = new URL(href)
            const targetLocale = Object.entries(OUT_DIRS).find(([, v]) =>
              href.includes(v.domain.replace('https://', ''))
            )
            if (targetLocale) {
              const targetDir = targetLocale[1].dir
              if (!checkInternalLink(targetDir, url.pathname)) {
                console.warn(`⚠️  BROKEN_CROSS_DOMAIN: ${path.relative(process.cwd(), file)} → ${href}`)
                allBroken.push({ file, href, type: 'external' })
                externalWarnings++
                stats.warnings++
              }
            }
          }
        }
      }
    }

    // Verificar nav/footer no index.html
    const indexPath = path.join(dir, 'index.html')
    if (existsSync(indexPath)) {
      const indexContent = readFileSync(indexPath, 'utf-8')
      // Extrair links de nav e footer (tags semânticas)
      const navSection = indexContent.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? ''
      const footerSection = indexContent.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)?.[1] ?? ''

      for (const [section, sectionHtml] of [['nav', navSection], ['footer', footerSection]]) {
        const sectionLinks = extractLinks(sectionHtml)
        for (const href of sectionLinks) {
          if (!href || !href.startsWith('/')) continue
          if (!checkInternalLink(dir, href)) {
            console.error(`❌ ${section.toUpperCase()}_BROKEN: ${dir}/index.html → ${href}`)
            internalErrors++
          }
        }
      }
    }

    if (stats.broken === 0) {
      console.log(`  ✅ ${dir}: zero broken internal links`)
    }
    statsByLocale[locale] = stats
  }

  // ─── Gerar relatório ─────────────────────────────────────────────────────────

  console.log(`\n📊 Resultado: ${internalErrors} broken internal, ${externalWarnings} warnings externos`)

  mkdirSync('docs', { recursive: true })
  const timestamp = new Date().toISOString().split('T')[0]
  const verdict = internalErrors === 0 ? 'APROVADO ✅' : 'REPROVADO ❌'

  const reportLines = [
    '# Broken Links Audit Report',
    `Generated: ${timestamp}`,
    '',
    '## Summary',
    '| Locale | Build | Arquivos | Links Verificados | Broken Internos | Warnings |',
    '|--------|-------|----------|-------------------|-----------------|----------|',
  ]

  for (const [locale, { dir }] of Object.entries(OUT_DIRS)) {
    const s = statsByLocale[locale] ?? { checked: 0, total: 0, broken: 0, warnings: 0 }
    reportLines.push(`| ${locale} | ${dir} | ${s.checked} | ${s.total} | ${s.broken} | ${s.warnings} |`)
  }

  if (routeErrors > 0) {
    reportLines.push('', `## Rotas Obrigatórias Ausentes (${routeErrors})`)
    reportLines.push('Ver output do script para detalhes.')
  }

  reportLines.push('', '## Links Quebrados')
  if (allBroken.length === 0) {
    reportLines.push('Nenhum — ✅ 100% OK')
  } else {
    allBroken.forEach(l => {
      const prefix = l.type === 'internal' ? '- ❌ INTERNAL' : '- ⚠️  EXTERNAL'
      reportLines.push(`${prefix} \`${path.relative(process.cwd(), l.file)}\` → \`${l.href}\``)
    })
  }

  reportLines.push('', `## Veredito`, `**${verdict}**`, '')
  writeFileSync('docs/BROKEN-LINKS-AUDIT.md', reportLines.join('\n'), 'utf-8')
  console.log('📄 Relatório gerado: docs/BROKEN-LINKS-AUDIT.md')

  if (internalErrors > 0) {
    console.error(`\n❌ ${internalErrors} link(s) interno(s) quebrado(s) encontrado(s)`)
    process.exit(1)
  }
  console.log('✅ Zero broken internal links — OK')
  process.exit(0)
}

main()
