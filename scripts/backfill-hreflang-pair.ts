/**
 * scripts/backfill-hreflang-pair.ts
 *
 * Backfill de hreflang_pair e exclusive nos 282 artigos legados identificados
 * pelo audit F0.1 (scheduled-updates/auto-blog/audit-decisions.json).
 *
 * Trata 3 tipos de decisão:
 *   keep_exclusive (110) — seta exclusive: true, garante hreflang_pair: []
 *   needs_pair_fix  (14) — injeta pares reversos a partir dos grupos já existentes
 *   needs_pair     (158) — descobre grupos por matching semântico de slug/título
 *                          dentro do mesmo batch de data
 *
 * Uso:
 *   npx tsx scripts/backfill-hreflang-pair.ts              # dry-run (default)
 *   npx tsx scripts/backfill-hreflang-pair.ts --write      # aplica mudanças
 *   npx tsx scripts/backfill-hreflang-pair.ts --write --confidence 0.20
 *   npx tsx scripts/backfill-hreflang-pair.ts --write --only exclusive
 *   npx tsx scripts/backfill-hreflang-pair.ts --write --only fix
 *
 * Idempotente: artigos já corretos não são tocados.
 *
 * Saída:
 *   .claude/blog/data/backfill-report.json  — resumo com stats + pending
 *   (stdout)                                — log detalhado
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type Locale = 'pt-BR' | 'it-IT' | 'en' | 'es-ES'
type Decision = 'needs_pair' | 'keep_exclusive' | 'needs_pair_fix'

interface AuditDecision {
  locale: Locale
  slug: string
  title: string
  date: string
  hp: string
  decision: Decision
  reason: string
}

interface HreflangPair {
  locale: Locale
  slug: string
}

interface MdxArticle {
  filePath: string
  slug: string
  locale: Locale
  data: Record<string, unknown>
  raw: string
  content: string
}

interface MatchCandidate {
  article: AuditDecision
  score: number
}

interface MatchedGroup {
  members: Array<{ locale: Locale; slug: string }>
  confidence: number
  type: 'universal' | 'trilingual' | 'bilingual'
  date: string
}

interface PendingItem {
  locale: Locale
  slug: string
  date: string
  reason: string
}

interface BackfillReport {
  dry_run: boolean
  generated_at: string
  stats: {
    exclusive_applied: number
    exclusive_skipped_already_set: number
    fix_applied: number
    fix_not_found: number
    pair_matched_high: number
    pair_matched_low_skipped: number
    pair_unmatched: number
    files_written: number
  }
  pending_manual_review: PendingItem[]
  groups_applied: MatchedGroup[]
}

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const CONTENT_ROOT = path.resolve(process.cwd(), 'content')
const AUDIT_FILE = path.resolve(
  process.cwd(),
  '../../../scheduled-updates/auto-blog/audit-decisions.json',
)
const REPORT_OUTPUT = path.resolve(process.cwd(), '.claude/blog/data/backfill-report.json')
const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'it-IT', 'en', 'es-ES']

// ---------------------------------------------------------------------------
// Mapa de normalização de tokens para matching cross-language
// ---------------------------------------------------------------------------

const TOKEN_MAP: Record<string, string> = {
  // IA / AI
  ia: 'ai', ai: 'ai',
  // Agent
  agente: 'agent', agenti: 'agent', agent: 'agent',
  // Development
  desenvolvimento: 'dev', sviluppo: 'dev', desarrollo: 'dev', development: 'dev',
  developer: 'dev', desenvolvedor: 'dev', sviluppatore: 'dev', desarrollador: 'dev',
  // Software / App
  aplicativo: 'app', applicazione: 'app', aplicacion: 'app', application: 'app', app: 'app',
  // Small business
  pequena: 'small', piccola: 'small', small: 'small',
  pme: 'sme', pmi: 'sme', pyme: 'sme', smb: 'sme',
  // Cost / Price
  custo: 'cost', costo: 'cost', coste: 'cost', preco: 'cost',
  prezzo: 'cost', precio: 'cost', cost: 'cost',
  // Build / Create
  construir: 'build', costruire: 'build', criar: 'build', creare: 'build',
  crear: 'build', build: 'build', building: 'build',
  // Guide / How
  guia: 'guide', guida: 'guide', guide: 'guide',
  como: 'how', come: 'how', how: 'how', cuanto: 'how', quanto: 'how',
  // Automation
  automatizar: 'automate', automatizzare: 'automate',
  automate: 'automate', automacao: 'automate', automazione: 'automate',
  automaticamente: 'automate',
  // Accessibility
  acessibilidade: 'accessibility', accessibilita: 'accessibility',
  accesibilidad: 'accessibility', accessibility: 'accessibility',
  // Business / Company
  empresa: 'company', azienda: 'company', business: 'company', negocio: 'company',
  // ROI / Results
  roi: 'roi', resultado: 'result', risultato: 'result', result: 'result',
  // Omnichannel
  omnichannel: 'omnichannel', omnicanal: 'omnichannel',
  // Timeline
  prazo: 'timeline', tempi: 'timeline', plazos: 'timeline', timeline: 'timeline',
  // Integration
  integracao: 'integration', integrazione: 'integration', integracion: 'integration',
  integration: 'integration', integrar: 'integration',
  // Platform
  plataforma: 'platform', piattaforma: 'platform', platform: 'platform',
  // Website / Web
  sito: 'web', site: 'web', web: 'web', website: 'web',
  // ECommerce
  loja: 'ecommerce', negozio: 'ecommerce', tienda: 'ecommerce', ecommerce: 'ecommerce',
  // Freelancer vs Agency
  freelancer: 'freelancer', freelance: 'freelancer',
  'software-house': 'agency', agency: 'agency', agencia: 'agency', agenzia: 'agency',
  // Urgency
  urgente: 'urgent', urgent: 'urgent',
  // Custom
  personalizado: 'custom', personalizzato: 'custom', custom: 'custom', medida: 'custom',
  // Security
  seguranca: 'security', sicurezza: 'security', seguridad: 'security', security: 'security',
  // Legacy
  legado: 'legacy', legacy: 'legacy',
  // Deploy
  deploy: 'deploy', deployment: 'deploy',
  // Internal tools
  interno: 'internal', interno2: 'internal', internal: 'internal',
}

// Tokens a ignorar no matching (stop words e ruído)
const STOP_TOKENS = new Set([
  'para', 'per', 'for', 'para', 'de', 'del', 'dei', 'the', 'a', 'an',
  'e', 'e2', 'o', 'os', 'as', 'em', 'no', 'na', 'con', 'com', 'with',
  'vs', 'vs2', 'versus', 'ou', 'or', 'and', 'se', 'when', 'quando',
  'que', 'what', 'il', 'la', 'le', 'gli', 'i', 'un', 'uma', 'seu',
  'sua', 'devo', 'should', 'can', 'pode', 'ha', 'faz', 'fazer', 'use',
  'usar', 'usare', 'usar', 'guia', 'guia2', 'brasil', 'brazil', 'italia',
  'espana', 'uk', 'usa', 'pme2', 'pmi2', 'em2', 'em3',
])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeToken(t: string): string {
  const lower = t.toLowerCase().replace(/[^a-z0-9]/g, '')
  return TOKEN_MAP[lower] ?? lower
}

function extractConcepts(slug: string): Set<string> {
  const tokens = slug
    .split('-')
    .filter(t => t.length > 2 && !/^\d{4}$/.test(t))
    .map(normalizeToken)
    .filter(t => !STOP_TOKENS.has(t))
  return new Set(tokens)
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  const intersection = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : intersection / union
}

function discoverMdxFiles(): Map<string, MdxArticle> {
  const map = new Map<string, MdxArticle>()
  for (const locale of SUPPORTED_LOCALES) {
    const blogDir = path.join(CONTENT_ROOT, locale, 'blog')
    if (!fs.existsSync(blogDir)) continue
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'))
    for (const file of files) {
      const filePath = path.join(blogDir, file)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(raw)
      const slug = path.basename(file, '.mdx')
      const key = `${locale}:${slug}`
      map.set(key, {
        filePath,
        slug,
        locale,
        data: parsed.data as Record<string, unknown>,
        raw,
        content: parsed.content,
      })
    }
  }
  return map
}

function writeMdxFrontmatter(
  article: MdxArticle,
  updates: Record<string, unknown>,
  dryRun: boolean,
): void {
  const newData = { ...article.data, ...updates }
  const updated = matter.stringify(article.content, newData)
  if (!dryRun) {
    fs.writeFileSync(article.filePath, updated, 'utf-8')
  }
}

function hreflangPairsAreEqual(
  a: HreflangPair[] | unknown,
  b: HreflangPair[],
): boolean {
  if (!Array.isArray(a)) return false
  if ((a as HreflangPair[]).length !== b.length) return false
  const aStr = (a as HreflangPair[])
    .map(p => `${p.locale}:${p.slug}`)
    .sort()
    .join(',')
  const bStr = b
    .map(p => `${p.locale}:${p.slug}`)
    .sort()
    .join(',')
  return aStr === bStr
}

// ---------------------------------------------------------------------------
// Phase 1 — keep_exclusive
// ---------------------------------------------------------------------------

function applyExclusive(
  decisions: AuditDecision[],
  articles: Map<string, MdxArticle>,
  dryRun: boolean,
  stats: BackfillReport['stats'],
): void {
  const exclusives = decisions.filter(d => d.decision === 'keep_exclusive')
  console.log(`\n[Phase 1] keep_exclusive: ${exclusives.length} artigos`)

  for (const d of exclusives) {
    const key = `${d.locale}:${d.slug}`
    const article = articles.get(key)
    if (!article) {
      console.warn(`  SKIP ${key} — arquivo não encontrado`)
      stats.exclusive_skipped_already_set++
      continue
    }

    const alreadySet =
      article.data.exclusive === true &&
      (Array.isArray(article.data.hreflang_pair)
        ? (article.data.hreflang_pair as unknown[]).length === 0
        : !article.data.hreflang_pair)

    if (alreadySet) {
      stats.exclusive_skipped_already_set++
      continue
    }

    const updates: Record<string, unknown> = {
      exclusive: true,
      hreflang_pair: [],
    }

    console.log(`  ${dryRun ? '[DRY]' : '[WRITE]'} ${key} → exclusive: true`)
    writeMdxFrontmatter(article, updates, dryRun)
    stats.exclusive_applied++
    stats.files_written++
  }
}

// ---------------------------------------------------------------------------
// Phase 2 — needs_pair_fix
// Artigos que já fazem parte de um grupo — outros locales têm hreflang_pair
// apontando para este slug, mas o próprio artigo não declara.
// ---------------------------------------------------------------------------

function applyPairFix(
  decisions: AuditDecision[],
  articles: Map<string, MdxArticle>,
  dryRun: boolean,
  stats: BackfillReport['stats'],
  groupsApplied: MatchedGroup[],
): void {
  const fixes = decisions.filter(d => d.decision === 'needs_pair_fix')
  console.log(`\n[Phase 2] needs_pair_fix: ${fixes.length} artigos`)

  for (const d of fixes) {
    const key = `${d.locale}:${d.slug}`
    const article = articles.get(key)
    if (!article) {
      console.warn(`  SKIP ${key} — arquivo não encontrado`)
      stats.fix_not_found++
      continue
    }

    // Encontrar todos os artigos em outros locales que referenciam este slug
    const peers: HreflangPair[] = []
    for (const [otherKey, otherArticle] of articles) {
      if (otherArticle.locale === d.locale) continue
      const pairs = otherArticle.data.hreflang_pair
      if (!Array.isArray(pairs)) continue
      const found = (pairs as HreflangPair[]).find(
        p => p.locale === d.locale && p.slug === d.slug,
      )
      if (found) {
        peers.push({ locale: otherArticle.locale, slug: otherArticle.slug })
      }
    }

    if (peers.length === 0) {
      console.warn(`  FAIL ${key} — nenhum peer encontrado com referência a este slug`)
      stats.fix_not_found++
      continue
    }

    // Deduplicar peers por locale — manter apenas o primeiro encontrado por locale
    const peersByLocale = new Map<Locale, HreflangPair>()
    for (const peer of peers) {
      if (!peersByLocale.has(peer.locale)) {
        peersByLocale.set(peer.locale, peer)
      }
    }
    const dedupedPeers = [...peersByLocale.values()]

    // Verificar se já está correto
    const currentPairs = article.data.hreflang_pair
    if (hreflangPairsAreEqual(currentPairs, dedupedPeers)) {
      stats.exclusive_skipped_already_set++ // reusar contador de skips
      continue
    }

    const updates: Record<string, unknown> = {
      exclusive: false,
      hreflang_pair: dedupedPeers,
    }

    const peerDesc = dedupedPeers.map(p => `${p.locale}:${p.slug}`).join(', ')
    console.log(`  ${dryRun ? '[DRY]' : '[WRITE]'} ${key} → pairs: [${peerDesc}]`)
    writeMdxFrontmatter(article, updates, dryRun)
    stats.fix_applied++
    stats.files_written++

    groupsApplied.push({
      members: [{ locale: d.locale, slug: d.slug }, ...dedupedPeers],
      confidence: 1.0,
      type:
        dedupedPeers.length === 3 ? 'universal' : dedupedPeers.length === 2 ? 'trilingual' : 'bilingual',
      date: d.date,
    })
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — needs_pair
// Matching semântico por data + similaridade de slug
// ---------------------------------------------------------------------------

function buildMatchGroups(
  decisions: AuditDecision[],
  threshold: number,
): { groups: MatchedGroup[]; pending: PendingItem[] } {
  const needsPair = decisions.filter(d => d.decision === 'needs_pair')
  const pending: PendingItem[] = []
  const groups: MatchedGroup[] = []

  // Agrupar por data
  const byDate = new Map<string, AuditDecision[]>()
  for (const d of needsPair) {
    const bucket = byDate.get(d.date) ?? []
    bucket.push(d)
    byDate.set(d.date, bucket)
  }

  for (const [date, batch] of byDate) {
    // Agrupar por locale dentro da data
    const byLocale = new Map<Locale, AuditDecision[]>()
    for (const d of batch) {
      const bucket = byLocale.get(d.locale) ?? []
      bucket.push(d)
      byLocale.set(d.locale, bucket)
    }

    const localesPresent = [...byLocale.keys()]

    // Extrair conceitos de cada artigo
    const concepts = new Map<string, Set<string>>()
    for (const d of batch) {
      concepts.set(`${d.locale}:${d.slug}`, extractConcepts(d.slug))
    }

    // Artigos já alocados a um grupo
    const allocated = new Set<string>()

    // Locale primário = o que tem mais artigos (anchor)
    const primaryLocale = localesPresent.reduce((a, b) =>
      (byLocale.get(a)?.length ?? 0) >= (byLocale.get(b)?.length ?? 0) ? a : b,
    )

    const primaryArticles = byLocale.get(primaryLocale) ?? []

    for (const primary of primaryArticles) {
      const primaryKey = `${primary.locale}:${primary.slug}`
      if (allocated.has(primaryKey)) continue

      const group: Array<{ locale: Locale; slug: string }> = [
        { locale: primary.locale, slug: primary.slug },
      ]
      let minScore = 1.0

      const primaryConcepts = concepts.get(primaryKey)!

      // Para cada outro locale, encontrar o melhor match
      for (const locale of localesPresent) {
        if (locale === primaryLocale) continue
        const candidates = byLocale.get(locale) ?? []

        let bestScore = 0
        let bestMatch: AuditDecision | null = null

        for (const candidate of candidates) {
          const candidateKey = `${candidate.locale}:${candidate.slug}`
          if (allocated.has(candidateKey)) continue
          const candConcepts = concepts.get(candidateKey)!
          const score = jaccardSimilarity(primaryConcepts, candConcepts)
          if (score > bestScore) {
            bestScore = score
            bestMatch = candidate
          }
        }

        if (bestMatch && bestScore >= threshold) {
          group.push({ locale: bestMatch.locale, slug: bestMatch.slug })
          minScore = Math.min(minScore, bestScore)
        }
      }

      // Só criar grupo se tiver pelo menos 2 membros
      if (group.length >= 2) {
        group.forEach(m => allocated.add(`${m.locale}:${m.slug}`))
        const type: MatchedGroup['type'] =
          group.length === 4 ? 'universal' : group.length === 3 ? 'trilingual' : 'bilingual'
        groups.push({ members: group, confidence: minScore, type, date })
      } else {
        // Não encontrou match suficiente
        pending.push({
          locale: primary.locale,
          slug: primary.slug,
          date,
          reason: `Nenhum match com confiança >= ${threshold} encontrado em ${localesPresent.filter(l => l !== primaryLocale).join(', ')}`,
        })
      }
    }

    // Segunda passagem: artigos não alocados em locales não-primários
    // podem ter equivalentes entre si (ex: en/it-IT/es-ES sem pt-BR)
    const unallocatedByLocale = new Map<Locale, AuditDecision[]>()
    for (const [locale, localArticles] of byLocale) {
      if (locale === primaryLocale) continue
      const remaining = localArticles.filter(d => !allocated.has(`${d.locale}:${d.slug}`))
      if (remaining.length > 0) unallocatedByLocale.set(locale, remaining)
    }

    if (unallocatedByLocale.size >= 2) {
      // Anchor no locale com mais artigos restantes
      const secondaryPrimary = [...unallocatedByLocale.keys()].reduce((a, b) =>
        (unallocatedByLocale.get(a)?.length ?? 0) >= (unallocatedByLocale.get(b)?.length ?? 0) ? a : b,
      )
      const secondaryArticles = unallocatedByLocale.get(secondaryPrimary) ?? []

      for (const primary of secondaryArticles) {
        const primaryKey = `${primary.locale}:${primary.slug}`
        if (allocated.has(primaryKey)) continue

        const group: Array<{ locale: Locale; slug: string }> = [
          { locale: primary.locale, slug: primary.slug },
        ]
        let minScore = 1.0
        const primaryConcepts = concepts.get(primaryKey)!

        for (const [locale, candidates] of unallocatedByLocale) {
          if (locale === secondaryPrimary) continue
          let bestScore = 0
          let bestMatch: AuditDecision | null = null
          for (const candidate of candidates) {
            const candKey = `${candidate.locale}:${candidate.slug}`
            if (allocated.has(candKey)) continue
            const score = jaccardSimilarity(primaryConcepts, concepts.get(candKey)!)
            if (score > bestScore) { bestScore = score; bestMatch = candidate }
          }
          if (bestMatch && bestScore >= threshold) {
            group.push({ locale: bestMatch.locale, slug: bestMatch.slug })
            minScore = Math.min(minScore, bestScore)
          }
        }

        if (group.length >= 2) {
          group.forEach(m => allocated.add(`${m.locale}:${m.slug}`))
          const type: MatchedGroup['type'] =
            group.length === 4 ? 'universal' : group.length === 3 ? 'trilingual' : 'bilingual'
          groups.push({ members: group, confidence: minScore, type, date })
        }
      }
    }

    // Artigos ainda não alocados = pendentes (deduplicado por key)
    const addedToPending = new Set<string>()
    for (const [, localArticles] of byLocale) {
      for (const d of localArticles) {
        const key = `${d.locale}:${d.slug}`
        if (!allocated.has(key) && !addedToPending.has(key)) {
          addedToPending.add(key)
          pending.push({
            locale: d.locale,
            slug: d.slug,
            date,
            reason: `Sem match com confiança >= ${threshold} no batch de ${date}`,
          })
        }
      }
    }
  }

  return { groups, pending }
}

function applyNeedsPair(
  groups: MatchedGroup[],
  articles: Map<string, MdxArticle>,
  dryRun: boolean,
  stats: BackfillReport['stats'],
  groupsApplied: MatchedGroup[],
): void {
  console.log(`\n[Phase 3] needs_pair: ${groups.length} grupos encontrados`)

  for (const group of groups) {
    const allExist = group.members.every(m => articles.has(`${m.locale}:${m.slug}`))
    if (!allExist) {
      const missing = group.members.filter(m => !articles.has(`${m.locale}:${m.slug}`))
      console.warn(
        `  SKIP grupo [${group.members.map(m => m.slug).join(', ')}] — arquivos ausentes: ${missing.map(m => m.slug).join(', ')}`,
      )
      stats.pair_unmatched++
      continue
    }

    // Para cada membro, injetar pares dos outros membros
    for (const member of group.members) {
      const key = `${member.locale}:${member.slug}`
      const article = articles.get(key)!
      const pairs = group.members
        .filter(m => m.locale !== member.locale)
        .map(m => ({ locale: m.locale, slug: m.slug }))

      // Verificar se já está correto
      if (
        article.data.exclusive !== true &&
        hreflangPairsAreEqual(article.data.hreflang_pair, pairs)
      ) {
        continue
      }

      const updates: Record<string, unknown> = {
        exclusive: false,
        hreflang_pair: pairs,
      }

      console.log(
        `  ${dryRun ? '[DRY]' : '[WRITE]'} ${key} [conf:${group.confidence.toFixed(2)}] → ${pairs.length} pares`,
      )
      writeMdxFrontmatter(article, updates, dryRun)
      stats.pair_matched_high++
      stats.files_written++
    }

    groupsApplied.push(group)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--write')
  const confidenceArg = args.find(a => a.startsWith('--confidence'))
  const confidence = confidenceArg ? parseFloat(confidenceArg.split('=')[1] ?? '0.25') : 0.25
  const onlyArg = args.find(a => a.startsWith('--only'))
  const only = onlyArg ? onlyArg.split('=')[1] ?? onlyArg.split(' ')[1] : null

  console.log(`\n=== backfill-hreflang-pair ===`)
  console.log(`Mode: ${dryRun ? 'DRY-RUN (use --write to apply)' : 'WRITE'}`)
  console.log(`Confidence threshold: ${confidence}`)
  if (only) console.log(`Only: ${only}`)

  // Carregar decisões
  if (!fs.existsSync(AUDIT_FILE)) {
    console.error(`FATAL: audit-decisions.json não encontrado em ${AUDIT_FILE}`)
    process.exit(1)
  }
  const decisions: AuditDecision[] = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'))
  console.log(`\nDecisões carregadas: ${decisions.length}`)

  // Descobrir artigos MDX
  console.log('Escaneando MDX files...')
  const articles = discoverMdxFiles()
  console.log(`Artigos MDX encontrados: ${articles.size}`)

  const stats: BackfillReport['stats'] = {
    exclusive_applied: 0,
    exclusive_skipped_already_set: 0,
    fix_applied: 0,
    fix_not_found: 0,
    pair_matched_high: 0,
    pair_matched_low_skipped: 0,
    pair_unmatched: 0,
    files_written: 0,
  }
  const groupsApplied: MatchedGroup[] = []

  // Phase 1 — exclusive
  if (!only || only === 'exclusive') {
    applyExclusive(decisions, articles, dryRun, stats)
  }

  // Phase 2 — pair_fix
  if (!only || only === 'fix') {
    applyPairFix(decisions, articles, dryRun, stats, groupsApplied)
  }

  // Phase 3 — needs_pair matching
  if (!only || only === 'pair') {
    const { groups, pending } = buildMatchGroups(decisions, confidence)
    console.log(`\n[Phase 3] Matching resultado:`)
    console.log(`  Grupos formados: ${groups.length}`)
    console.log(`  Artigos sem match: ${pending.length}`)

    stats.pair_unmatched = pending.length
    applyNeedsPair(groups, articles, dryRun, stats, groupsApplied)

    // Gerar report
    const report: BackfillReport = {
      dry_run: dryRun,
      generated_at: new Date().toISOString(),
      stats,
      pending_manual_review: pending,
      groups_applied: groupsApplied,
    }

    const reportDir = path.dirname(REPORT_OUTPUT)
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
    if (!dryRun) {
      fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(report, null, 2), 'utf-8')
      console.log(`\nReport salvo em: ${REPORT_OUTPUT}`)
    }

    // Sumário final
    console.log('\n=== SUMÁRIO ===')
    console.log(`exclusive aplicados:       ${stats.exclusive_applied}`)
    console.log(`exclusive já corretos:     ${stats.exclusive_skipped_already_set}`)
    console.log(`pair_fix aplicados:        ${stats.fix_applied}`)
    console.log(`pair_fix não encontrados:  ${stats.fix_not_found}`)
    console.log(`pairs aplicados (alta conf): ${stats.pair_matched_high}`)
    console.log(`pairs sem match:           ${stats.pair_unmatched}`)
    console.log(`Arquivos escritos:         ${dryRun ? '0 (dry-run)' : stats.files_written}`)

    if (pending.length > 0) {
      console.log(`\n[PENDENTES REVISÃO MANUAL — ${pending.length}]`)
      for (const p of pending) {
        console.log(`  ${p.locale}:${p.slug} (${p.date}) — ${p.reason}`)
      }
    }

    if (dryRun && stats.files_written === 0) {
      console.log('\nRodando em DRY-RUN. Para aplicar: npx tsx scripts/backfill-hreflang-pair.ts --write')
    }
  } else {
    // Phases parciais — report simplificado
    console.log('\n=== SUMÁRIO ===')
    console.log(`exclusive aplicados:    ${stats.exclusive_applied}`)
    console.log(`pair_fix aplicados:     ${stats.fix_applied}`)
    console.log(`Arquivos escritos:      ${dryRun ? '0 (dry-run)' : stats.files_written}`)
  }
}

main()
