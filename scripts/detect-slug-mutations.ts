/**
 * scripts/detect-slug-mutations.ts
 *
 * Pre-commit hook: detecta git mv / git rm de arquivos .mdx em content/{locale}/blog/.
 * Para cada rename/delete emite evento slug_renamed ou slug_deleted no invalidation-log.
 * Também identifica pacotes do stockpile que referenciam o slug afetado e os invalida.
 *
 * F3.3 — critério de aceite:
 *   - `git mv content/pt-BR/blog/foo.mdx bar.mdx` → evento slug_renamed emitido
 *   - `git rm content/en/blog/foo.mdx` → evento slug_deleted emitido
 *   - Pacotes com link interno para o slug afetado recebem evento de invalidação
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { appendInvalidationEvent } from '../src/lib/blog/invalidation-log'
import type { InvalidationEvent } from '../src/lib/blog/stockpile-schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const STOCKPILE_DIR = path.join(REPO_ROOT, '.claude', 'blog', 'data', 'stockpile')
const BLOG_CONTENT_RE = /^content\/([^/]+)\/blog\/(.+)\.mdx$/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlugMutation {
  type: 'renamed' | 'deleted'
  locale: string
  oldSlug: string
  newSlug?: string  // only for renamed
  oldPath: string
  newPath?: string  // only for renamed
}

// ---------------------------------------------------------------------------
// Git diff parsing
// ---------------------------------------------------------------------------

/**
 * Returns staged slug mutations from `git diff --cached --name-status --diff-filter=RD`.
 * Handles renames (R) and deletes (D) of .mdx files in content/{locale}/blog/.
 */
export function detectStagedSlugMutations(): SlugMutation[] {
  let output: string
  try {
    output = execSync('git diff --cached --name-status --diff-filter=RD', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
  } catch {
    return []
  }

  const mutations: SlugMutation[] = []

  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Rename: "R100\told/path.mdx\tnew/path.mdx"
    const renameMatch = trimmed.match(/^R\d*\t(.+)\t(.+)$/)
    if (renameMatch) {
      const oldPath = renameMatch[1]!
      const newPath = renameMatch[2]!
      const oldBlog = oldPath.match(BLOG_CONTENT_RE)
      if (!oldBlog) continue

      const locale = oldBlog[1]!
      const oldSlug = path.basename(oldBlog[2]!)
      const newBlog = newPath.match(BLOG_CONTENT_RE)
      const newSlug = newBlog ? path.basename(newBlog[2]!) : path.basename(newPath, '.mdx')

      mutations.push({ type: 'renamed', locale, oldSlug, newSlug, oldPath, newPath })
      continue
    }

    // Delete: "D\tpath.mdx"
    const deleteMatch = trimmed.match(/^D\t(.+)$/)
    if (deleteMatch) {
      const oldPath = deleteMatch[1]!
      const blog = oldPath.match(BLOG_CONTENT_RE)
      if (!blog) continue

      const locale = blog[1]!
      const oldSlug = path.basename(blog[2]!)
      mutations.push({ type: 'deleted', locale, oldSlug, oldPath })
    }
  }

  return mutations
}

// ---------------------------------------------------------------------------
// Stockpile: find packages that reference a slug via internal links
// ---------------------------------------------------------------------------

/**
 * Searches reviewed.md files in stockpile packages for references to a slug.
 * Returns equivalence_ids of matching packages.
 */
export function findPackagesReferencingSlug(slug: string, stockpileDir = STOCKPILE_DIR): string[] {
  const packagesDir = path.join(stockpileDir, 'packages')
  if (!fs.existsSync(packagesDir)) return []

  const affected: string[] = []

  for (const uuid of fs.readdirSync(packagesDir)) {
    const pkgDir = path.join(packagesDir, uuid)
    if (!fs.statSync(pkgDir).isDirectory()) continue

    // Check package.json promotion_state — only active packages matter
    const pkgJsonPath = path.join(pkgDir, 'package.json')
    if (!fs.existsSync(pkgJsonPath)) continue
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as { promotion_state?: string }
      if (!['available', 'locked'].includes(pkg.promotion_state ?? '')) continue
    } catch {
      continue
    }

    // Check any reviewed.md for slug reference
    let found = false
    for (const localeDir of fs.readdirSync(pkgDir)) {
      if (found) break
      const reviewedPath = path.join(pkgDir, localeDir, 'reviewed.md')
      if (!fs.existsSync(reviewedPath)) continue
      const content = fs.readFileSync(reviewedPath, 'utf8')
      // Match markdown links: [text](/blog/slug) or [text](https?://*/blog/slug)
      if (new RegExp(`/blog/${slug}[/"')\\s]`).test(content)) {
        found = true
      }
    }

    if (found) affected.push(uuid)
  }

  return affected
}

// ---------------------------------------------------------------------------
// Emit invalidation events
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

export function emitSlugMutationEvents(
  mutations: SlugMutation[],
  stockpileDir?: string,
): { eventsEmitted: number; packagesInvalidated: number } {
  let eventsEmitted = 0
  let packagesInvalidated = 0

  for (const mutation of mutations) {
    const eventType = mutation.type === 'renamed' ? 'slug_renamed' : 'slug_deleted'
    const reason =
      mutation.type === 'renamed'
        ? `Slug renomeado: ${mutation.oldSlug} → ${mutation.newSlug} (locale: ${mutation.locale})`
        : `Slug removido: ${mutation.oldSlug} (locale: ${mutation.locale})`

    // Primary event for the mutation itself
    // event_type is restricted to schema enum, so we use 'invalidated' as the carrier
    const mutationEvent: InvalidationEvent = {
      event_id: randomUUID(),
      event_type: 'invalidated',
      equivalence_id: randomUUID(),  // synthetic — no real package, just a log record
      timestamp: now(),
      reason: `[${eventType}] ${reason}`,
      triggered_by: 'detect-slug-mutations',
      affected_locales: [mutation.locale as 'pt-BR' | 'it-IT' | 'en' | 'es-ES'],
    }

    appendInvalidationEvent(mutationEvent, stockpileDir ?? STOCKPILE_DIR)
    eventsEmitted++

    // Invalidate packages that reference the old slug
    const affectedPackages = findPackagesReferencingSlug(mutation.oldSlug, stockpileDir ?? STOCKPILE_DIR)
    for (const equivalenceId of affectedPackages) {
      const pkgEvent: InvalidationEvent = {
        event_id: randomUUID(),
        event_type: 'invalidated',
        equivalence_id: equivalenceId,
        timestamp: now(),
        reason: `Artigo linkado sofreu ${eventType}: ${mutation.oldSlug}${mutation.newSlug ? ` → ${mutation.newSlug}` : ''}`,
        triggered_by: 'detect-slug-mutations',
        affected_locales: [mutation.locale as 'pt-BR' | 'it-IT' | 'en' | 'es-ES'],
      }
      appendInvalidationEvent(pkgEvent, stockpileDir ?? STOCKPILE_DIR)
      eventsEmitted++
      packagesInvalidated++
    }
  }

  return { eventsEmitted, packagesInvalidated }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const mutations = detectStagedSlugMutations()

  if (mutations.length === 0) {
    process.exit(0)
  }

  console.log(`\n[detect-slug-mutations] ${mutations.length} mutacao(oes) de slug detectada(s)`)

  const { eventsEmitted, packagesInvalidated } = emitSlugMutationEvents(mutations)

  for (const m of mutations) {
    if (m.type === 'renamed') {
      console.log(`  RENOMEADO  ${m.locale}/${m.oldSlug} → ${m.newSlug}`)
    } else {
      console.log(`  DELETADO   ${m.locale}/${m.oldSlug}`)
    }
  }

  if (packagesInvalidated > 0) {
    console.log(`  ${packagesInvalidated} pacote(s) do stockpile invalidados por link rompido`)
  }

  console.log(`  ${eventsEmitted} evento(s) emitido(s) no invalidation-log`)
}

const isMain = process.argv[1] === __filename
if (isMain) {
  main()
}
