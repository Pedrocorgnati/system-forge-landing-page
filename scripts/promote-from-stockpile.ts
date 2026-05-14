/**
 * scripts/promote-from-stockpile.ts
 *
 * Promove pacotes elegiveis do stockpile para content/{locale}/blog/{slug}.mdx
 * e faz commit + push para main. Idempotente via promotion_state.
 *
 * Fluxo (8 passos):
 *   1. acquire run lock TTL 30min
 *   2. ler packages/{uuid}/package.json
 *   3. filtrar promotion_state==available && fresh && !invalidated
 *   4. agrupar por locale, sort por equivalence_id (FIFO), pick top MAX_PER_LOCALE
 *   5. copiar reviewed.md -> content/{locale}/blog/{slug}.mdx; validar PostFrontmatterSchema
 *   6. marcar promotion_state=promoted + promoted_at=now (uma vez por pacote)
 *   7. git config + add + commit + pull --rebase + push origin main
 *   8. release lock (try/finally, sempre)
 *
 * Env vars (todos com default):
 *   MAX_PER_LOCALE (default 3)
 *   LOCALES (default "pt-BR,it-IT,en,es-ES")
 *   STOCKPILE_DIR (default ".claude/blog/data/stockpile")
 *   CONTENT_DIR (default "content")
 *   GIT_REMOTE (default "origin")
 *   GIT_BRANCH (default "main")
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { acquireRunLock, releaseRunLock } from '../src/lib/blog/stockpile-locks'
import { evaluateFreshness } from '../src/lib/blog/freshness-gate'
import { checkInvalidation } from '../src/lib/blog/stockpile-invalidation-check'
import { PostFrontmatterSchema } from '../src/lib/blog/post-schema'
import type { StockpilePackage, SupportedLocale } from '../src/lib/blog/stockpile-schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const MAX_PER_LOCALE = Number(process.env.MAX_PER_LOCALE ?? 3)
const LOCALES = (process.env.LOCALES ?? 'pt-BR,it-IT,en,es-ES').split(',').map((l) => l.trim()) as SupportedLocale[]
const STOCKPILE_DIR = path.resolve(REPO_ROOT, process.env.STOCKPILE_DIR ?? '.claude/blog/data/stockpile')
const CONTENT_DIR = path.resolve(REPO_ROOT, process.env.CONTENT_DIR ?? 'content')
const GIT_REMOTE = process.env.GIT_REMOTE ?? 'origin'
const GIT_BRANCH = process.env.GIT_BRANCH ?? 'main'

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: 'utf8' })
}

function loadPackages(): Array<{ pkg: StockpilePackage; dir: string }> {
  const root = path.join(STOCKPILE_DIR, 'packages')
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = path.join(root, d.name)
      const pkgPath = path.join(dir, 'package.json')
      if (!fs.existsSync(pkgPath)) return null
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as StockpilePackage
        return { pkg, dir }
      } catch {
        return null
      }
    })
    .filter((x): x is { pkg: StockpilePackage; dir: string } => x !== null)
}

function main(): void {
  const runId = randomUUID()
  const lock = acquireRunLock(STOCKPILE_DIR, runId, 30)
  if (!lock.acquired) {
    console.error(`[promote] outra execucao detem o lock: ${JSON.stringify(lock.existing_lock)}`)
    process.exit(2)
  }

  try {
    const all = loadPackages()
    const eligible = all.filter(({ pkg }) => {
      if (pkg.promotion_state !== 'available') return false
      if (evaluateFreshness(pkg).action !== 'promote') return false
      if (checkInvalidation(pkg.equivalence_id, STOCKPILE_DIR).blocked) return false
      return true
    })
    eligible.sort((a, b) => a.pkg.equivalence_id.localeCompare(b.pkg.equivalence_id))

    const promotedIds = new Set<string>()
    const writes: Array<{ pkgDir: string; locale: SupportedLocale; slug: string; target: string }> = []
    const counts: Record<string, number> = Object.fromEntries(LOCALES.map((l) => [l, 0]))

    for (const locale of LOCALES) {
      for (const { pkg, dir } of eligible) {
        if (counts[locale]! >= MAX_PER_LOCALE) break
        if (!pkg.locales_present.includes(locale)) continue
        const reviewed = path.join(dir, locale, 'reviewed.md')
        if (!fs.existsSync(reviewed)) continue
        const raw = fs.readFileSync(reviewed, 'utf8')
        const parsed = matter(raw)
        const schemaResult = PostFrontmatterSchema.safeParse(parsed.data)
        if (!schemaResult.success) {
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: schema invalido (${schemaResult.error.issues[0]?.message ?? 'unknown'})`)
          continue
        }
        const slug = String(parsed.data.slug)
        const target = path.join(CONTENT_DIR, locale, 'blog', `${slug}.mdx`)
        if (fs.existsSync(target)) {
          console.warn(`[promote] skip ${pkg.equivalence_id}/${locale}: slug-collision em ${target}`)
          continue
        }
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, raw, 'utf8')
        writes.push({ pkgDir: dir, locale, slug, target })
        promotedIds.add(pkg.equivalence_id)
        counts[locale] = counts[locale]! + 1
      }
    }

    if (writes.length === 0) {
      console.log('[promote] nenhum pacote elegivel — no-op')
      return
    }

    const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    for (const { pkgDir } of writes) {
      const pkgPath = path.join(pkgDir, 'package.json')
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as StockpilePackage
      if (pkg.promotion_state === 'promoted') continue
      pkg.promotion_state = 'promoted'
      pkg.lifecycle.promoted_at = now
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    }

    git('config user.name "github-actions[bot]"')
    git('config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
    git('add -A')
    const summary = LOCALES.map((l) => `${l}=${counts[l] ?? 0}`).join(' ')
    const msg = `content(multilanguage): promote daily batch (${summary})`
    git(`commit -m ${JSON.stringify(msg)}`)
    git(`pull --rebase ${GIT_REMOTE} ${GIT_BRANCH}`)
    git(`push ${GIT_REMOTE} HEAD:${GIT_BRANCH}`)

    console.log(`[promote] OK: ${writes.length} arquivos | ${summary}`)
  } finally {
    releaseRunLock(STOCKPILE_DIR, runId)
  }
}

main()
