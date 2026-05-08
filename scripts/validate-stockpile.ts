/**
 * scripts/validate-stockpile.ts
 *
 * Validador standalone do Stockpile V2.
 *
 * Validações:
 *   1. Cada packages/{eqid}/package.json parseia no StockpilePackageSchema.
 *   2. equivalence_id no nome do dir == equivalence_id dentro do JSON.
 *   3. Para cada locale em locales_present: existe {locale}/reviewed.md e {locale}/metadata.json.
 *   4. index.json (se existir) é consistente com diretórios físicos.
 *   5. invalidation-log.jsonl parseia linha-a-linha; eventos referenciam pacotes existentes.
 *   6. Sem colisão de equivalence_id entre packages/ e quaisquer subdirs.
 *
 * Uso:
 *   npx tsx scripts/validate-stockpile.ts            # valida diretório padrão
 *   npx tsx scripts/validate-stockpile.ts --dir path  # valida diretório customizado
 *
 * Exit code: 0 = válido, 1 = erros encontrados.
 *
 * F1.2 — critério de aceite: <2s para 50 pacotes.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { StockpilePackageSchema, InvalidationEventSchema, StockpileIndexSchema } from '../src/lib/blog/stockpile-schema'
import { readAndUpgradePackage } from '../src/lib/blog/stockpile-schema-upgrader'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, '..')
const DEFAULT_STOCKPILE_DIR = path.join(REPO_ROOT, '.claude', 'blog', 'data', 'stockpile')

const dirArgIdx = process.argv.indexOf('--dir')
const STOCKPILE_DIR =
  dirArgIdx !== -1 && process.argv[dirArgIdx + 1]
    ? path.resolve(process.argv[dirArgIdx + 1]!)
    : DEFAULT_STOCKPILE_DIR

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationError {
  code: string
  path: string
  message: string
}

interface ValidationResult {
  errors: ValidationError[]
  warnings: string[]
  stats: {
    packages_scanned: number
    duration_ms: number
  }
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function validatePackages(packagesDir: string, errors: ValidationError[]): Set<string> {
  const knownIds = new Set<string>()

  if (!fs.existsSync(packagesDir)) return knownIds

  const entries = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())

  for (const entry of entries) {
    const dirName = entry.name
    const pkgPath = path.join(packagesDir, dirName, 'package.json')

    // Check package.json exists
    if (!fs.existsSync(pkgPath)) {
      errors.push({
        code: 'PKG_MISSING_JSON',
        path: path.join('packages', dirName),
        message: `package.json ausente no diretório do pacote`,
      })
      continue
    }

    // Parse and validate schema
    let pkg: ReturnType<typeof readAndUpgradePackage>
    try {
      pkg = readAndUpgradePackage(pkgPath)
    } catch (err) {
      errors.push({
        code: 'PKG_SCHEMA_INVALID',
        path: pkgPath,
        message: String(err),
      })
      continue
    }

    // Validate dir name == equivalence_id
    if (dirName !== pkg.equivalence_id) {
      errors.push({
        code: 'PKG_ID_MISMATCH',
        path: pkgPath,
        message: `Dir "${dirName}" != equivalence_id "${pkg.equivalence_id}"`,
      })
    }

    // Validate locale files
    for (const locale of pkg.locales_present) {
      const localeDir = path.join(packagesDir, dirName, locale)
      const reviewedMd = path.join(localeDir, 'reviewed.md')
      const metadataJson = path.join(localeDir, 'metadata.json')

      if (!fs.existsSync(reviewedMd)) {
        errors.push({
          code: 'PKG_MISSING_REVIEWED_MD',
          path: reviewedMd,
          message: `reviewed.md ausente para locale "${locale}"`,
        })
      }
      if (!fs.existsSync(metadataJson)) {
        errors.push({
          code: 'PKG_MISSING_METADATA_JSON',
          path: metadataJson,
          message: `metadata.json ausente para locale "${locale}"`,
        })
      }
    }

    // Check equivalence_id collision
    if (knownIds.has(pkg.equivalence_id)) {
      errors.push({
        code: 'PKG_ID_COLLISION',
        path: pkgPath,
        message: `equivalence_id "${pkg.equivalence_id}" duplicado`,
      })
    }
    knownIds.add(pkg.equivalence_id)
  }

  return knownIds
}

function validateIndex(stockpileDir: string, knownIds: Set<string>, errors: ValidationError[], warnings: string[]): void {
  const indexPath = path.join(stockpileDir, 'index.json')
  if (!fs.existsSync(indexPath)) return

  let indexRaw: unknown
  try {
    indexRaw = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  } catch (err) {
    errors.push({ code: 'INDEX_PARSE_ERROR', path: indexPath, message: String(err) })
    return
  }

  const result = StockpileIndexSchema.safeParse(indexRaw)
  if (!result.success) {
    errors.push({
      code: 'INDEX_SCHEMA_INVALID',
      path: indexPath,
      message: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
    })
    return
  }

  // Check index entries are consistent with physical packages
  for (const entry of result.data.packages) {
    if (!knownIds.has(entry.equivalence_id)) {
      warnings.push(
        `index.json referencia "${entry.equivalence_id}" mas package.json não encontrado em packages/`
      )
    }
  }

  // Check total_packages count
  if (result.data.total_packages !== result.data.packages.length) {
    errors.push({
      code: 'INDEX_COUNT_MISMATCH',
      path: indexPath,
      message: `total_packages=${result.data.total_packages} mas packages.length=${result.data.packages.length}`,
    })
  }
}

function validateInvalidationLog(stockpileDir: string, knownIds: Set<string>, errors: ValidationError[], warnings: string[]): void {
  const logPath = path.join(stockpileDir, 'invalidation-log.jsonl')
  if (!fs.existsSync(logPath)) return

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(l => l.trim())
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch {
      errors.push({
        code: 'LOG_PARSE_ERROR',
        path: `${logPath}:${i + 1}`,
        message: `Linha ${i + 1} não é JSON válido`,
      })
      continue
    }

    const result = InvalidationEventSchema.safeParse(parsed)
    if (!result.success) {
      errors.push({
        code: 'LOG_EVENT_INVALID',
        path: `${logPath}:${i + 1}`,
        message: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
      })
      continue
    }

    // Warn if referenced equivalence_id not in known packages
    if (!knownIds.has(result.data.equivalence_id)) {
      warnings.push(
        `invalidation-log linha ${i + 1}: equivalence_id "${result.data.equivalence_id}" não encontrado em packages/ (pode estar em _archived/)`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Slug collision guard (used by promote pipeline as preflight)
// ---------------------------------------------------------------------------

export interface SlugCollision {
  equivalence_id: string
  locale: string
  slug: string
  existing_path: string
}

export function checkSlugCollisions(
  stockpileDir: string,
  contentRoot: string,
  equivalenceIds?: string[],
): SlugCollision[] {
  const collisions: SlugCollision[] = []
  const packagesDir = path.join(stockpileDir, 'packages')
  if (!fs.existsSync(packagesDir)) return collisions

  const entries = fs.readdirSync(packagesDir, { withFileTypes: true }).filter(e => e.isDirectory())

  for (const entry of entries) {
    const pkgPath = path.join(packagesDir, entry.name, 'package.json')
    if (!fs.existsSync(pkgPath)) continue
    if (equivalenceIds && !equivalenceIds.includes(entry.name)) continue

    let pkg: { locales_present?: string[]; promotion_state?: string }
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    } catch {
      continue
    }

    if (!Array.isArray(pkg.locales_present)) continue
    if (pkg.promotion_state === 'promoted') continue  // already promoted, skip

    for (const locale of pkg.locales_present) {
      const metaPath = path.join(packagesDir, entry.name, locale, 'metadata.json')
      if (!fs.existsSync(metaPath)) continue

      let meta: { slug?: string }
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      } catch {
        continue
      }

      if (!meta.slug) continue

      const existingMdx = path.join(contentRoot, locale, 'blog', `${meta.slug}.mdx`)
      if (fs.existsSync(existingMdx)) {
        collisions.push({
          equivalence_id: entry.name,
          locale,
          slug: meta.slug,
          existing_path: existingMdx,
        })
      }
    }
  }

  return collisions
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function runValidation(stockpileDir: string): ValidationResult {
  const start = Date.now()
  const errors: ValidationError[] = []
  const warnings: string[] = []

  if (!fs.existsSync(stockpileDir)) {
    errors.push({
      code: 'DIR_NOT_FOUND',
      path: stockpileDir,
      message: `Diretório do stockpile não encontrado: ${stockpileDir}`,
    })
    return { errors, warnings, stats: { packages_scanned: 0, duration_ms: Date.now() - start } }
  }

  const packagesDir = path.join(stockpileDir, 'packages')
  const knownIds = validatePackages(packagesDir, errors)
  const packagesScanned = knownIds.size

  validateIndex(stockpileDir, knownIds, errors, warnings)
  validateInvalidationLog(stockpileDir, knownIds, errors, warnings)

  return {
    errors,
    warnings,
    stats: { packages_scanned: packagesScanned, duration_ms: Date.now() - start },
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === __filename) {
  const result = runValidation(STOCKPILE_DIR)

  console.log(`\nValidando: ${STOCKPILE_DIR}`)
  console.log(`Pacotes escaneados: ${result.stats.packages_scanned}`)
  console.log(`Duração: ${result.stats.duration_ms}ms`)

  if (result.warnings.length > 0) {
    console.log(`\n⚠  Warnings (${result.warnings.length}):`)
    for (const w of result.warnings) console.log(`  - ${w}`)
  }

  if (result.errors.length > 0) {
    console.error(`\n❌ Erros (${result.errors.length}):`)
    for (const e of result.errors) {
      console.error(`  [${e.code}] ${e.path}`)
      console.error(`    ${e.message}`)
    }
    process.exit(1)
  }

  console.log('\n✅ Stockpile válido')
  process.exit(0)
}
