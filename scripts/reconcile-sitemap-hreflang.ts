/**
 * scripts/reconcile-sitemap-hreflang.ts
 * Reconciliador pós-build dos 4 sitemaps hreflang (quad-market).
 *
 * PROBLEMA: o hreflang de artigos de blog é montado por-locale a partir do
 * frontmatter `hreflang_pair` de cada artigo (ver src/lib/seo/build-alternates.ts).
 * Cada build (build:br/it/en/es) só enxerga os artigos do seu próprio locale,
 * então pares assimétricos/quebrados no conteúdo (gerado pela routine blog-daily)
 * produzem sitemaps que violam NEXT-005:
 *   - X-DEFAULT AUSENTE: cluster sem versão EN (x-default deve apontar para EN).
 *   - RECIPROCIDADE: A aponta para B, mas B não aponta de volta para A.
 *
 * Um produtor por-locale NÃO consegue corrigir reciprocidade (não vê os irmãos).
 * Este script roda DEPOIS dos 4 builds, lê os 4 sitemaps juntos e reescreve os
 * blocos `<xhtml:link>` para um conjunto mutuamente consistente:
 *   1. mantém apenas arestas MÚTUAS (A->B só se B->A também existir);
 *   2. componentes conexos do grafo mútuo => clusters; 1 representante por locale
 *      (href lexicograficamente menor) — descarta duplicatas do mesmo idioma;
 *   3. só emite alternates quando o cluster tem >=2 locales E inclui EN
 *      (x-default obrigatório -> EN); senão remove os alternates da URL.
 *
 * Determinístico, idempotente, NUNCA inventa URL (apenas poda/normaliza).
 * Deve rodar entre os 4 builds e `validate:sitemap-hreflang` (ver smoke:seo).
 *
 * Usage: tsx scripts/reconcile-sitemap-hreflang.ts
 * Exit: 0 sempre que conseguir reescrever; 2 se algum sitemap estiver ausente.
 *
 * NEXT-005 (INT-019, INT-072, INT-085).
 */
import * as fs from 'node:fs'

const EN_DOMAIN = 'https://systemforgesoftware.com'

const SITEMAP_PATHS: Record<string, string> = {
  br: 'dist-br/sitemap.xml',
  it: 'dist-it/sitemap.xml',
  en: 'dist-en/sitemap.xml',
  es: 'dist-es/sitemap.xml',
}

// Domínio -> hreflang code. Fonte espelhada de config (HREFLANG_CODE / LOCALE_URLS).
const DOMAIN_LOCALE: Record<string, string> = {
  'forjadesistemas.com.br': 'pt-BR',
  'systemforge.it': 'it',
  'systemforgesoftware.com': 'en',
  'systemforge.es': 'es',
}
// Ordem canônica de emissão dos <xhtml:link>.
const LOCALE_ORDER = ['pt-BR', 'it', 'en', 'es']

type Alt = { hreflang: string; href: string }

function hostOf(url: string): string {
  const m = url.match(/^https?:\/\/([^/]+)/)
  return m ? m[1] : ''
}
function localeOf(url: string): string | undefined {
  return DOMAIN_LOCALE[hostOf(url)]
}

function validatePaths(): void {
  const missing = Object.entries(SITEMAP_PATHS)
    .filter(([, p]) => !fs.existsSync(p))
    .map(([loc, p]) => `  - ${p} (build '${loc}' não executado)`)
  if (missing.length > 0) {
    console.error('❌ Sitemaps ausentes. Rode os 4 builds antes do reconcile:')
    missing.forEach((m) => console.error(m))
    process.exit(2)
  }
}

function parse(xml: string): Map<string, Alt[]> {
  const map = new Map<string, Alt[]>()
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? []
  for (const block of blocks) {
    const locMatch = block.match(/<loc>([\s\S]*?)<\/loc>/)
    if (!locMatch) continue
    const loc = locMatch[1].trim()
    const alts: Alt[] = []
    const re = /<(?:xhtml:)?link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) alts.push({ hreflang: m[1], href: m[2] })
    map.set(loc, alts)
  }
  return map
}

// Union-find ----------------------------------------------------------------
function makeDSU() {
  const parent = new Map<string, string>()
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x)
    let r = x
    while (parent.get(r) !== r) r = parent.get(r)!
    // path compression
    let c = x
    while (parent.get(c) !== r) {
      const n = parent.get(c)!
      parent.set(c, r)
      c = n
    }
    return r
  }
  const union = (a: string, b: string) => parent.set(find(a), find(b))
  return { find, union }
}

function main(): void {
  validatePaths()

  const texts: Record<string, string> = {}
  const entries = new Map<string, Alt[]>()
  for (const [loc, p] of Object.entries(SITEMAP_PATHS)) {
    texts[loc] = fs.readFileSync(p, 'utf-8')
    for (const [url, alts] of parse(texts[loc])) entries.set(url, alts)
  }

  // Conjunto de arestas direcionadas (não-x-default).
  const links = new Set<string>()
  const key = (a: string, b: string) => `${a} ${b}`
  for (const [loc, alts] of entries) {
    for (const a of alts) {
      if (a.hreflang === 'x-default') continue
      links.add(key(loc, a.href))
    }
  }
  const mutual = (a: string, b: string) => links.has(key(a, b)) && links.has(key(b, a))

  // Componentes conexos do grafo mútuo.
  const dsu = makeDSU()
  for (const loc of entries.keys()) dsu.find(loc)
  for (const [loc, alts] of entries) {
    for (const a of alts) {
      if (a.hreflang === 'x-default' || a.href === loc) continue
      if (entries.has(a.href) && mutual(loc, a.href)) dsu.union(loc, a.href)
    }
  }
  const comps = new Map<string, string[]>()
  for (const loc of entries.keys()) {
    const r = dsu.find(loc)
    if (!comps.has(r)) comps.set(r, [])
    comps.get(r)!.push(loc)
  }

  // Resolve alternates por URL.
  const result = new Map<string, Alt[]>()
  for (const members of comps.values()) {
    const byLocale = new Map<string, string[]>()
    for (const m of members) {
      const lc = localeOf(m)
      if (!lc) continue
      if (!byLocale.has(lc)) byLocale.set(lc, [])
      byLocale.get(lc)!.push(m)
    }
    // 1 representante por locale (href lexicográfico mínimo => determinístico).
    const reps = new Map<string, string>()
    for (const [lc, urls] of byLocale) reps.set(lc, urls.slice().sort()[0])

    const valid = reps.size >= 2 && reps.has('en')
    if (valid) {
      const altset: Alt[] = []
      for (const lc of LOCALE_ORDER) {
        const href = reps.get(lc)
        if (href) altset.push({ hreflang: lc, href })
      }
      altset.push({ hreflang: 'x-default', href: reps.get('en')! })
      for (const m of members) {
        const lc = localeOf(m)
        result.set(m, lc && reps.get(lc) === m ? altset : [])
      }
    } else {
      for (const m of members) result.set(m, [])
    }
  }

  // Reescreve cada sitemap.
  const renderAlts = (alts: Alt[]) =>
    alts
      .map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />\n`)
      .join('')

  let urlsTouched = 0
  let altsKept = 0
  let altsDropped = 0
  for (const [loc, p] of Object.entries(SITEMAP_PATHS)) {
    const before = texts[loc]
    const after = before.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
      const locMatch = block.match(/<loc>([\s\S]*?)<\/loc>/)
      if (!locMatch) return block
      const url = locMatch[1].trim()
      const hadAlts = /<(?:xhtml:)?link[^>]*\/>/.test(block)
      // remove links existentes
      let cleaned = block.replace(/<(?:xhtml:)?link[^>]*\/>\n/g, '')
      const alts = result.get(url) ?? []
      if (alts.length > 0) {
        cleaned = cleaned.replace(locMatch[0] + '\n', locMatch[0] + '\n' + renderAlts(alts))
        altsKept += 1
      } else if (hadAlts) {
        altsDropped += 1
      }
      if (hadAlts || alts.length > 0) urlsTouched += 1
      return cleaned
    })
    if (after !== before) fs.writeFileSync(p, after, 'utf-8')
  }

  console.log('═══════════════════════════════════════════════════')
  console.log('  Hreflang Sitemap Reconciler — Quad Market')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  URLs avaliadas: ${entries.size}`)
  console.log(`  URLs com cluster válido (alternates mantidos): ${altsKept}`)
  console.log(`  URLs com alternates podados (cluster quebrado/sem EN): ${altsDropped}`)
  console.log(`✅ Reconcile concluído. Rode validate:sitemap-hreflang para confirmar.`)
}

main()
