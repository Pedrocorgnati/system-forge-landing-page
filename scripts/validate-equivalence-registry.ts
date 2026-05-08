/**
 * validate-equivalence-registry.ts
 *
 * Validates legacy-equivalence-registry.json against live content MDX files.
 *
 * Checks:
 *   1. Registry is parseable and has required fields
 *   2. No duplicate members across groups
 *   3. Every member slug resolves to an existing MDX file
 *   4. Every member's MDX file is non-exclusive (exclusive articles must not be in registry)
 *   5. Each member's hreflang_pair contains all other group members (full mesh)
 *      [WARN-only for groups with transitive-only connections]
 *
 * Usage:
 *   npx tsx scripts/validate-equivalence-registry.ts
 *   npx tsx scripts/validate-equivalence-registry.ts --strict   # warnings → errors
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STRICT = process.argv.includes('--strict')
const CONTENT_ROOT = path.resolve(__dirname, '../content')
const REGISTRY_PATH = path.resolve(__dirname, '../.claude/blog/data/legacy-equivalence-registry.json')

const LOCALES = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const
type Locale = typeof LOCALES[number]

interface HreflangPair {
  locale: Locale
  slug: string
}

interface RegistryMember {
  locale: Locale
  slug: string
}

interface RegistryEntry {
  equivalence_id: string
  members: RegistryMember[]
  type: string
}

interface Registry {
  version: number
  groups: RegistryEntry[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mdxPath(locale: Locale, slug: string): string {
  return path.join(CONTENT_ROOT, locale, 'blog', `${slug}.mdx`)
}

function loadFrontmatter(locale: Locale, slug: string): Record<string, unknown> | null {
  const p = mdxPath(locale, slug)
  if (!fs.existsSync(p)) return null
  const raw = fs.readFileSync(p, 'utf-8')
  return matter(raw).data as Record<string, unknown>
}

function getHreflangPair(data: Record<string, unknown>): HreflangPair[] {
  if (!Array.isArray(data.hreflang_pair)) return []
  return (data.hreflang_pair as Record<string, string>[])
    .filter(p => p && typeof p.locale === 'string' && typeof p.slug === 'string')
    .map(p => ({ locale: p.locale as Locale, slug: p.slug }))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\nvalidate-equivalence-registry ${STRICT ? '(strict mode)' : ''}\n`)

  // Load registry
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`❌ Registry not found: ${REGISTRY_PATH}`)
    process.exit(1)
  }

  let registry: Registry
  try {
    registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
  } catch (e) {
    console.error(`❌ Failed to parse registry JSON: ${e}`)
    process.exit(1)
  }

  if (!registry.version || !Array.isArray(registry.groups)) {
    console.error('❌ Registry missing required fields: version, groups')
    process.exit(1)
  }

  console.log(`Registry: v${registry.version} — ${registry.groups.length} groups`)

  const errors: string[] = []
  const warnings: string[] = []

  // Check 1: No duplicate members
  const seenMembers = new Map<string, string>() // locale:slug → equivalence_id
  for (const entry of registry.groups) {
    if (!entry.equivalence_id || !Array.isArray(entry.members)) {
      errors.push(`Entry missing equivalence_id or members`)
      continue
    }
    for (const m of entry.members) {
      const key = `${m.locale}:${m.slug}`
      if (seenMembers.has(key)) {
        errors.push(`Duplicate: ${key} in ${seenMembers.get(key)} AND ${entry.equivalence_id}`)
      } else {
        seenMembers.set(key, entry.equivalence_id)
      }
    }
  }

  // Check 2 & 3 & 4 & 5: per-group deep validation
  let missingFiles = 0
  let exclusiveInGroup = 0
  let meshWarnings = 0

  for (const entry of registry.groups) {
    if (!Array.isArray(entry.members)) continue

    for (const m of entry.members) {
      // Check 2: file exists
      const data = loadFrontmatter(m.locale as Locale, m.slug)
      if (!data) {
        errors.push(`Missing file: ${m.locale}/blog/${m.slug}.mdx (in group ${entry.equivalence_id})`)
        missingFiles++
        continue
      }

      // Check 3: not exclusive
      if (data.exclusive === true) {
        errors.push(`Exclusive article in registry: ${m.locale}:${m.slug} (group ${entry.equivalence_id})`)
        exclusiveInGroup++
        continue
      }

      // Check 4: full mesh — article declares all other group members
      const pair = getHreflangPair(data)
      for (const sibling of entry.members) {
        if (sibling.locale === m.locale && sibling.slug === m.slug) continue
        const declares = pair.some(p => p.locale === sibling.locale && p.slug === sibling.slug)
        if (!declares) {
          const msg = `Incomplete mesh: ${m.locale}:${m.slug} does not declare ${sibling.locale}:${sibling.slug} (group ${entry.equivalence_id})`
          if (STRICT) {
            errors.push(msg)
          } else {
            warnings.push(msg)
            meshWarnings++
          }
        }
      }
    }
  }

  // Summary
  console.log(`\nChecked: ${registry.groups.length} groups, ${seenMembers.size} member references`)
  console.log(`Missing files: ${missingFiles}`)
  console.log(`Exclusive-in-group: ${exclusiveInGroup}`)
  console.log(`Mesh warnings: ${meshWarnings}${STRICT ? ' (treated as errors in strict mode)' : ''}`)

  if (errors.length > 0) {
    console.error(`\n❌ Errors (${errors.length}):`)
    for (const e of errors.slice(0, 30)) console.error('  -', e)
    if (errors.length > 30) console.error(`  ... and ${errors.length - 30} more`)
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠  Warnings (${warnings.length}) — pass --strict to treat as errors:`)
    for (const w of warnings.slice(0, 5)) console.warn('  -', w)
    if (warnings.length > 5) console.warn(`  ... and ${warnings.length - 5} more`)
  }

  console.log('\n✅ Registry valid')
  process.exit(0)
}

main()
