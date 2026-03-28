/**
 * scripts/validate-hreflang-sitemaps.ts
 * Validação de reciprocidade hreflang entre os 3 sitemaps XML gerados.
 *
 * Regras NEXT-005:
 *   1. Reciprocidade bidirecional: se BR → IT, então IT → BR
 *   2. x-default obrigatório em toda URL com alternates
 *   3. x-default deve apontar para domínio EN
 *   4. Sem hreflang apontando para domínio errado (auto-referência cruzada)
 *
 * Usage:
 *   tsx scripts/validate-hreflang-sitemaps.ts
 *
 * Exit codes:
 *   0 — reciprocidade validada (zero violações)
 *   1 — violações de hreflang encontradas
 *   2 — pré-condição não satisfeita (builds ausentes)
 *
 * INT-019, INT-072, INT-085 — NEXT-005
 */

import * as fs from 'node:fs'

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

// Hardcoded: este script roda como standalone Node (sem @config alias),
// portanto não pode importar LOCALE_URLS. Se o domínio EN mudar,
// atualizar aqui E em config/index.ts (LOCALE_URLS['en']).
const EN_DOMAIN = 'https://systemforgesoftware.com'

const SITEMAP_PATHS: Record<string, string> = {
  br: 'dist-br/sitemap.xml',
  it: 'dist-it/sitemap.xml',
  en: 'dist-en/sitemap.xml',
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface SitemapEntry {
  loc: string
  alternates: Array<{ hreflang: string; href: string }>
}

// ---------------------------------------------------------------------------
// Validação de pré-condições
// ---------------------------------------------------------------------------

function validatePaths(): void {
  const missing: string[] = []
  for (const [locale, path] of Object.entries(SITEMAP_PATHS)) {
    if (!fs.existsSync(path)) {
      missing.push(`  - ${path} (build '${locale}' não executado)`)
    }
  }
  if (missing.length > 0) {
    console.error('❌ Sitemaps não encontrados. Execute os builds primeiro:')
    missing.forEach(m => console.error(m))
    console.error('\nComandos: npm run build:br && npm run build:it && npm run build:en')
    process.exit(2)
  }
}

// ---------------------------------------------------------------------------
// Parser XML minimalista (sem dependências externas)
// Extrai <loc> e <xhtml:link> de sitemaps Next.js
// ---------------------------------------------------------------------------

function parseSitemap(path: string): SitemapEntry[] {
  let xml: string
  try {
    xml = fs.readFileSync(path, 'utf-8')
  } catch (err) {
    console.error(`❌ Erro ao ler ${path}: ${(err as Error).message}`)
    process.exit(1)
  }

  const entries: SitemapEntry[] = []

  // Extrair blocos <url>...</url>
  const urlBlocks = xml.match(/<url>([\s\S]*?)<\/url>/g) ?? []

  for (const block of urlBlocks) {
    // Extrair <loc>
    const locMatch = block.match(/<loc>([\s\S]*?)<\/loc>/)
    if (!locMatch) continue
    const loc = locMatch[1].trim()

    // Extrair todos os <xhtml:link .../>
    const alternates: Array<{ hreflang: string; href: string }> = []
    const linkPattern = /<(?:xhtml:)?link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g
    let linkMatch: RegExpExecArray | null

    while ((linkMatch = linkPattern.exec(block)) !== null) {
      alternates.push({ hreflang: linkMatch[1], href: linkMatch[2] })
    }

    entries.push({ loc, alternates })
  }

  return entries
}

// ---------------------------------------------------------------------------
// Verificação 1: Reciprocidade bidirecional
// ---------------------------------------------------------------------------

function checkReciprocity(
  sitemaps: Record<string, SitemapEntry[]>,
  violations: string[],
): void {
  for (const [localeA, entriesA] of Object.entries(sitemaps)) {
    for (const entry of entriesA) {
      for (const alt of entry.alternates) {
        if (alt.hreflang === 'x-default') continue

        // Encontrar qual sitemap contém a URL alvo
        const targetLocale = Object.entries(SITEMAP_PATHS).find(([_k, _v]) => {
          return Object.values(sitemaps).some(entries =>
            entries.some(e => e.loc === alt.href),
          )
        })?.[0]

        if (!targetLocale) continue

        const targetEntries = sitemaps[targetLocale]
        if (!targetEntries) continue

        const targetEntry = targetEntries.find(e => e.loc === alt.href)
        if (!targetEntry) {
          violations.push(
            `[${localeA.toUpperCase()}→MISSING] ${entry.loc} aponta para ${alt.href} (hreflang="${alt.hreflang}") mas URL não existe em nenhum sitemap`,
          )
          continue
        }

        // Verificar back-reference
        const hasBackRef = targetEntry.alternates.some(a => a.href === entry.loc)
        if (!hasBackRef) {
          violations.push(
            `[RECIPROCIDADE] ${alt.href} não faz back-reference para ${entry.loc}`,
          )
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Verificação 2: x-default obrigatório e aponta para EN
// ---------------------------------------------------------------------------

function checkXDefault(
  sitemaps: Record<string, SitemapEntry[]>,
  violations: string[],
): void {
  for (const [locale, entries] of Object.entries(sitemaps)) {
    for (const entry of entries) {
      // URLs sem alternates (artigos exclusivos) são ignoradas
      if (entry.alternates.length === 0) continue

      const xDefault = entry.alternates.find(a => a.hreflang === 'x-default')

      if (!xDefault) {
        violations.push(
          `[X-DEFAULT AUSENTE] ${entry.loc} no sitemap '${locale}' não tem x-default`,
        )
        continue
      }

      if (!xDefault.href.startsWith(EN_DOMAIN)) {
        violations.push(
          `[X-DEFAULT ERRADO] ${entry.loc}: x-default aponta para ${xDefault.href} mas deveria apontar para ${EN_DOMAIN}`,
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Verificação 3: Sem hreflang apontando para domínio diferente do esperado
// ---------------------------------------------------------------------------

function checkNoSelfReference(
  sitemaps: Record<string, SitemapEntry[]>,
  violations: string[],
): void {
  for (const [_locale, entries] of Object.entries(sitemaps)) {
    for (const entry of entries) {
      const entryHostname = new URL(entry.loc).hostname

      for (const alt of entry.alternates) {
        if (alt.hreflang === 'x-default') continue

        try {
          const altHostname = new URL(alt.href).hostname
          // Detectar hreflang apontando para domínio diferente do próprio locale
          // mas no mesmo domínio que o entry (exceto quando é o hreflang do próprio locale)
          if (altHostname === entryHostname && alt.href !== entry.loc) {
            violations.push(
              `[AUTO-REF ESTRANHA] ${entry.loc}: hreflang="${alt.hreflang}" aponta para ${alt.href} (mesmo domínio, URL diferente)`,
            )
          }
        } catch {
          violations.push(`[URL INVÁLIDA] ${alt.href} não é uma URL válida`)
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Hreflang Sitemap Validator — Triple Market')
  console.log('  Regras: NEXT-005 (INT-019, INT-072, INT-085)')
  console.log('═══════════════════════════════════════════════════\n')

  // Verificar que os builds existem
  validatePaths()

  // Parsear os 3 sitemaps
  console.log('📄 Lendo sitemaps...')
  const sitemaps: Record<string, SitemapEntry[]> = {}
  for (const [locale, path] of Object.entries(SITEMAP_PATHS)) {
    sitemaps[locale] = parseSitemap(path)
    console.log(`  ${locale.toUpperCase()}: ${sitemaps[locale].length} URLs encontradas`)
  }

  const totalUrls = Object.values(sitemaps).reduce((acc, e) => acc + e.length, 0)
  console.log(`\n🔍 Validando ${totalUrls} URLs no total...\n`)

  const violations: string[] = []

  checkReciprocity(sitemaps, violations)
  checkXDefault(sitemaps, violations)
  checkNoSelfReference(sitemaps, violations)

  if (violations.length === 0) {
    console.log(
      `✅ Hreflang reciprocidade verificada para ${totalUrls} URLs ` +
      `(${sitemaps.br.length} BR + ${sitemaps.it.length} IT + ${sitemaps.en.length} EN)`,
    )
    process.exit(0)
  } else {
    console.error(`❌ ${violations.length} violação(ões) hreflang encontrada(s):\n`)
    violations.forEach((v, i) => console.error(`  ${i + 1}. ${v}`))
    console.error('\nCorreções necessárias em src/app/sitemap.ts ou conteúdo do blog.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
