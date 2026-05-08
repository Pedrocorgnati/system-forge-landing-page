/**
 * build-legacy-equivalence-registry.ts
 *
 * Reads all MDX files across the 4 content locales, parses hreflang_pair
 * declarations, and builds legacy-equivalence-registry.json via union-find.
 *
 * Registry entry:
 *   { equivalence_id, members, type, created_via, stable_since }
 *
 * Acceptance criteria (F0.3.a):
 *   - Every non-exclusive article with hreflang_pair appears in exactly 1 entry
 *   - No duplicate slugs across entries
 *   - validate-equivalence-registry.ts passes
 *
 * Usage:
 *   npx tsx scripts/build-legacy-equivalence-registry.ts           # dry-run
 *   npx tsx scripts/build-legacy-equivalence-registry.ts --write   # write JSON
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WRITE = process.argv.includes('--write')
const CONTENT_ROOT = path.resolve(__dirname, '../content')
const REGISTRY_PATH = path.resolve(__dirname, '../.claude/blog/data/legacy-equivalence-registry.json')

const LOCALES = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const
type Locale = typeof LOCALES[number]

interface HreflangPair {
  locale: Locale
  slug: string
}

interface ArticleInfo {
  locale: Locale
  slug: string
  exclusive: boolean
  hreflangPair: HreflangPair[]
  filePath: string
}

type GroupType = 'universal' | 'trilingual' | 'bilingual'

interface RegistryEntry {
  equivalence_id: string
  members: { locale: Locale; slug: string }[]
  type: GroupType
  created_via: 'legacy-backfill'
  stable_since: string
}

interface Registry {
  version: number
  generated_at: string
  total_groups: number
  total_articles_covered: number
  orphan_count: number
  groups: RegistryEntry[]
}

// ─── Union-Find ───────────────────────────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map()

  private root(key: string): string {
    if (!this.parent.has(key)) this.parent.set(key, key)
    if (this.parent.get(key) !== key) {
      this.parent.set(key, this.root(this.parent.get(key)!))
    }
    return this.parent.get(key)!
  }

  union(a: string, b: string): void {
    const ra = this.root(a)
    const rb = this.root(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }

  groupBy<T>(keys: string[], items: Map<string, T>): Map<string, T[]> {
    const groups = new Map<string, T[]>()
    for (const key of keys) {
      const r = this.root(key)
      if (!groups.has(r)) groups.set(r, [])
      groups.get(r)!.push(items.get(key)!)
    }
    return groups
  }
}

// ─── Load articles ────────────────────────────────────────────────────────────

function loadArticles(): ArticleInfo[] {
  const articles: ArticleInfo[] = []
  for (const locale of LOCALES) {
    const dir = path.join(CONTENT_ROOT, locale, 'blog')
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.mdx')) continue
      const filePath = path.join(dir, file)
      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = matter(raw)
      const data = parsed.data as Record<string, unknown>

      const slug = (data.slug as string) || file.replace('.mdx', '')
      const exclusive = data.exclusive === true

      let hreflangPair: HreflangPair[] = []
      if (Array.isArray(data.hreflang_pair)) {
        hreflangPair = (data.hreflang_pair as Record<string, string>[])
          .filter(p => p && typeof p.locale === 'string' && typeof p.slug === 'string')
          .map(p => ({ locale: p.locale as Locale, slug: p.slug }))
      }

      articles.push({ locale, slug, exclusive, hreflangPair, filePath })
    }
  }
  return articles
}

// ─── Build groups ─────────────────────────────────────────────────────────────

function buildGroups(articles: ArticleInfo[]): {
  entries: RegistryEntry[]
  orphans: ArticleInfo[]
} {
  const uf = new UnionFind()
  const articleMap = new Map<string, ArticleInfo>()

  // Index by "locale:slug" key
  for (const art of articles) {
    articleMap.set(`${art.locale}:${art.slug}`, art)
  }

  // Connect all hreflang_pair edges
  for (const art of articles) {
    if (art.exclusive) continue
    const selfKey = `${art.locale}:${art.slug}`
    for (const pair of art.hreflangPair) {
      const pairKey = `${pair.locale}:${pair.slug}`
      uf.union(selfKey, pairKey)
    }
  }

  // Collect all non-exclusive articles that have at least 1 pair
  const groupedKeys: string[] = []
  const orphans: ArticleInfo[] = []

  for (const art of articles) {
    if (art.exclusive) continue
    if (art.hreflangPair.length === 0) {
      orphans.push(art)
      continue
    }
    groupedKeys.push(`${art.locale}:${art.slug}`)
  }

  // Deduplicate keys (same article might be ref'd from multiple sides)
  const uniqueKeys = [...new Set(groupedKeys)]
  const groups = uf.groupBy(uniqueKeys, articleMap)

  const today = new Date().toISOString().slice(0, 10)
  const entries: RegistryEntry[] = []

  for (const [, members] of groups) {
    // Deduplicate members by locale:slug
    const seen = new Set<string>()
    const deduped = members
      .filter(m => {
        if (!m) return false
        const k = `${m.locale}:${m.slug}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .sort((a, b) => {
        const order: Record<Locale, number> = { 'pt-BR': 0, 'it-IT': 1, 'en': 2, 'es-ES': 3 }
        return order[a.locale] - order[b.locale]
      })

    // Build type by counting distinct locales
    const localeSet = new Set(deduped.map(m => m.locale))
    const type: GroupType =
      localeSet.size >= 4 ? 'universal' :
      localeSet.size === 3 ? 'trilingual' : 'bilingual'

    entries.push({
      equivalence_id: randomUUID(),
      members: deduped.map(m => ({ locale: m.locale, slug: m.slug })),
      type,
      created_via: 'legacy-backfill',
      stable_since: today,
    })
  }

  // Sort entries by type (universal first) then by first member slug
  entries.sort((a, b) => {
    const order = { universal: 0, trilingual: 1, bilingual: 2 }
    const diff = order[a.type] - order[b.type]
    if (diff !== 0) return diff
    return a.members[0].slug.localeCompare(b.members[0].slug)
  })

  return { entries, orphans }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

interface ValidationResult {
  errors: string[]   // hard failures — registry corrupted
  warnings: string[] // data quality issues — logged but not fatal
}

function validate(entries: RegistryEntry[], articles: ArticleInfo[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const seen = new Map<string, string>() // key → equivalence_id

  // HARD ERROR: same article appearing in multiple groups (registry corruption)
  for (const entry of entries) {
    for (const m of entry.members) {
      const key = `${m.locale}:${m.slug}`
      if (seen.has(key)) {
        errors.push(`Duplicate member: ${key} in ${seen.get(key)} AND ${entry.equivalence_id}`)
      }
      seen.set(key, entry.equivalence_id)
    }
  }

  // WARNING: transitive member not directly declared by article
  // Happens when union-find merges A→B, B→C into {A,B,C} but A doesn't declare C.
  // Pre-existing data quality issue — not registry corruption.
  const registryIndex = new Map<string, RegistryEntry>()
  for (const entry of entries) {
    for (const m of entry.members) {
      registryIndex.set(`${m.locale}:${m.slug}`, entry)
    }
  }

  for (const art of articles) {
    if (art.exclusive || art.hreflangPair.length === 0) continue
    const artKey = `${art.locale}:${art.slug}`
    const entry = registryIndex.get(artKey)
    if (!entry) continue

    for (const sibling of entry.members) {
      if (sibling.locale === art.locale && sibling.slug === art.slug) continue
      const declares = art.hreflangPair.some(
        p => p.locale === sibling.locale && p.slug === sibling.slug
      )
      if (!declares) {
        warnings.push(
          `Transitive member not declared: ${artKey} grouped with ${sibling.locale}:${sibling.slug} via transitivity but no direct declaration`
        )
      }
    }
  }

  return { errors, warnings }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\nbuild-legacy-equivalence-registry — ${WRITE ? 'WRITE MODE' : 'dry-run'}\n`)

  const articles = loadArticles()
  console.log(`Loaded: ${articles.length} articles across ${LOCALES.length} locales`)

  const nonExclusive = articles.filter(a => !a.exclusive)
  const withPairs = nonExclusive.filter(a => a.hreflangPair.length > 0)
  console.log(`Non-exclusive: ${nonExclusive.length} | With hreflang_pair: ${withPairs.length}`)

  const { entries, orphans } = buildGroups(articles)

  const totalCovered = entries.reduce((sum, e) => sum + e.members.length, 0)
  const byType = { universal: 0, trilingual: 0, bilingual: 0 }
  for (const e of entries) byType[e.type]++

  console.log(`\nGroups built: ${entries.length}`)
  console.log(`  universal:  ${byType.universal}`)
  console.log(`  trilingual: ${byType.trilingual}`)
  console.log(`  bilingual:  ${byType.bilingual}`)
  console.log(`Articles covered: ${totalCovered}`)
  console.log(`Orphans (no pairs): ${orphans.length}`)

  // Validate
  const { errors, warnings } = validate(entries, articles)
  if (errors.length > 0) {
    console.error(`\n❌ Hard errors (${errors.length}) — registry invalid:`)
    for (const e of errors) console.error('  -', e)
  } else {
    console.log('\n✅ Internal validation passed (no hard errors)')
  }
  if (warnings.length > 0) {
    console.warn(`\n⚠  Transitive-member warnings (${warnings.length}) — pre-existing data quality:`)
    for (const w of warnings.slice(0, 5)) console.warn('  -', w)
    if (warnings.length > 5) console.warn(`  ... and ${warnings.length - 5} more (see registry generation log)`)
  }

  if (orphans.length > 0) {
    console.warn(`\n⚠  Orphan articles (${orphans.length}) — not in registry (no hreflang_pair):`)
    for (const o of orphans.slice(0, 10)) {
      console.warn(`  ${o.locale}/${o.slug}`)
    }
    if (orphans.length > 10) console.warn(`  ... and ${orphans.length - 10} more`)
  }

  const registry: Registry = {
    version: 1,
    generated_at: new Date().toISOString(),
    total_groups: entries.length,
    total_articles_covered: totalCovered,
    orphan_count: orphans.length,
    groups: entries,
  }

  // Also store warnings in the registry for transparency
  const registryWithMeta = {
    ...registry,
    transitive_warning_count: warnings.length,
    orphan_slugs: orphans.map(o => `${o.locale}:${o.slug}`),
  }

  if (WRITE) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registryWithMeta, null, 2) + '\n', 'utf-8')
    console.log(`\n✅ Written: ${REGISTRY_PATH}`)
  } else {
    console.log('\n(dry-run — pass --write to save)')
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

main()
