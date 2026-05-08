/**
 * scripts/backfill-canonical-datemodified.ts
 *
 * F0.5.c — Backfill `canonical` e `dateModified` em todos os artigos MDX legados.
 *
 *   canonical    = "{site_url}/blog/{slug}"  (se ausente)
 *   dateModified = data do último commit git que tocou o arquivo;
 *                  fallback = frontmatter `date`
 *
 * Uso:
 *   npx tsx scripts/backfill-canonical-datemodified.ts           # dry-run (default)
 *   npx tsx scripts/backfill-canonical-datemodified.ts --write   # aplica mudanças
 *   npx tsx scripts/backfill-canonical-datemodified.ts --write --locale pt-BR
 *
 * Idempotente: arquivos que já têm ambos os campos são ignorados.
 *
 * Saída:
 *   stdout — log + stats
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..')
const CONTENT_ROOT = path.join(REPO_ROOT, 'content')

const LOCALE_SITE_URLS: Record<string, string> = {
  'pt-BR': 'https://forjadesistemas.com.br',
  'it-IT': 'https://systemforge.it',
  'en':    'https://systemforgesoftware.com',
  'es-ES': 'https://systemforge.es',
}

const ALL_LOCALES = Object.keys(LOCALE_SITE_URLS)

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const DRY_RUN = !process.argv.includes('--write')
const localeArg = process.argv.includes('--locale')
  ? process.argv[process.argv.indexOf('--locale') + 1]
  : null
const LOCALES = localeArg ? [localeArg] : ALL_LOCALES

if (DRY_RUN) {
  console.log('DRY-RUN mode — use --write to apply changes\n')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGitLastModified(filePath: string): string | null {
  try {
    const relative = path.relative(REPO_ROOT, filePath)
    const result = execSync(
      `git -C "${REPO_ROOT}" log --format="%ai" -1 -- "${relative}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()
    if (!result) return null
    // Normalize to YYYY-MM-DD
    return result.slice(0, 10)
  } catch {
    return null
  }
}

function collectMdxFiles(localeDir: string): string[] {
  const blogDir = path.join(localeDir, 'blog')
  if (!fs.existsSync(blogDir)) return []
  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => path.join(blogDir, f))
}

// Inject fields into the raw YAML frontmatter string to preserve existing field order.
// Appends after the last existing frontmatter line.
function injectFields(raw: string, fields: Record<string, string>): string {
  // Split frontmatter from body
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!fmMatch) return raw
  const [, yamlBlock, body] = fmMatch
  let updatedYaml = yamlBlock!
  for (const [key, value] of Object.entries(fields)) {
    updatedYaml += `\n${key}: "${value}"`
  }
  return `---\n${updatedYaml}\n---\n${body}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Stats {
  processed: number
  skipped: number
  addedCanonical: number
  addedDateModified: number
  gitDateUsed: number
  fallbackDateUsed: number
  errors: string[]
}

const stats: Stats = {
  processed: 0,
  skipped: 0,
  addedCanonical: 0,
  addedDateModified: 0,
  gitDateUsed: 0,
  fallbackDateUsed: 0,
  errors: [],
}

for (const locale of LOCALES) {
  const localeDir = path.join(CONTENT_ROOT, locale)
  if (!fs.existsSync(localeDir)) {
    console.warn(`[WARN] Locale dir not found: ${localeDir}`)
    continue
  }
  const siteUrl = LOCALE_SITE_URLS[locale]!
  const files = collectMdxFiles(localeDir)

  let localeAddedCanonical = 0
  let localeAddedDateModified = 0

  for (const filePath of files) {
    stats.processed++
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const { data: fm } = matter(raw)

      const hasCanonical = 'canonical' in fm && typeof fm.canonical === 'string'
      const hasDateModified = 'dateModified' in fm && typeof fm.dateModified === 'string'

      if (hasCanonical && hasDateModified) {
        stats.skipped++
        continue
      }

      const fieldsToAdd: Record<string, string> = {}

      if (!hasCanonical) {
        const slug = fm.slug as string
        if (!slug) {
          stats.errors.push(`${filePath}: missing slug, cannot build canonical`)
          continue
        }
        fieldsToAdd['canonical'] = `${siteUrl}/blog/${slug}`
        localeAddedCanonical++
        stats.addedCanonical++
      }

      if (!hasDateModified) {
        const gitDate = getGitLastModified(filePath)
        if (gitDate) {
          fieldsToAdd['dateModified'] = gitDate
          stats.gitDateUsed++
        } else {
          const fallback = fm.date as string
          if (!fallback) {
            stats.errors.push(`${filePath}: missing date, cannot set dateModified`)
            continue
          }
          fieldsToAdd['dateModified'] = fallback
          stats.fallbackDateUsed++
        }
        localeAddedDateModified++
        stats.addedDateModified++
      }

      if (!DRY_RUN) {
        const updated = injectFields(raw, fieldsToAdd)
        fs.writeFileSync(filePath, updated, 'utf8')
      }
    } catch (err) {
      stats.errors.push(`${filePath}: ${String(err)}`)
    }
  }

  const label = DRY_RUN ? '[DRY-RUN]' : '[WRITE]'
  console.log(
    `${label} [${locale}] ${files.length} files — +${localeAddedCanonical} canonical, +${localeAddedDateModified} dateModified`
  )
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n─── Resumo ───')
console.log(`Processados: ${stats.processed}`)
console.log(`Já completos (skipped): ${stats.skipped}`)
console.log(`canonical adicionado: ${stats.addedCanonical}`)
console.log(`dateModified adicionado: ${stats.addedDateModified}`)
console.log(`  via git log: ${stats.gitDateUsed}`)
console.log(`  via fallback date: ${stats.fallbackDateUsed}`)

if (stats.errors.length > 0) {
  console.error(`\nErros (${stats.errors.length}):`)
  for (const e of stats.errors) console.error(`  ${e}`)
  process.exit(1)
}

if (DRY_RUN) {
  console.log('\nNada foi escrito. Use --write para aplicar.')
} else {
  console.log('\nBackfill concluído.')
}
