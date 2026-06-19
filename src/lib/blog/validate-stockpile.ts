/**
 * validate-stockpile.ts
 *
 * Valida estrutura dos packages em .claude/blog/data/stockpile/packages/
 * Executado via: npm run validate:stockpile
 */

import fs from 'fs'
import path from 'path'

const STOCKPILE_ROOT = '.claude/blog/data/stockpile/packages'

interface ValidationError {
  package: string
  code: string
  message: string
}

function validate(): { errors: ValidationError[]; packagesTotal: number; packagesValid: number } {
  const errors: ValidationError[] = []
  let packagesTotal = 0
  let packagesValid = 0

  if (!fs.existsSync(STOCKPILE_ROOT)) {
    return { errors: [{ package: '-', code: 'NO_STOCKPILE', message: 'Diretorio packages/ nao encontrado' }], packagesTotal: 0, packagesValid: 0 }
  }

  const dirs = fs.readdirSync(STOCKPILE_ROOT).filter(d => fs.statSync(path.join(STOCKPILE_ROOT, d)).isDirectory())

  for (const pkg of dirs) {
    packagesTotal++
    const pkgPath = path.join(STOCKPILE_ROOT, pkg)
    const pkgJsonPath = path.join(pkgPath, 'package.json')

    if (!fs.existsSync(pkgJsonPath)) {
      errors.push({ package: pkg, code: 'PKG_SCHEMA_INVALID', message: 'package.json ausente' })
      continue
    }

    let manifest: Record<string, unknown>
    try {
      manifest = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    } catch {
      errors.push({ package: pkg, code: 'PKG_SCHEMA_INVALID', message: 'package.json malformado' })
      continue
    }

    if (!manifest.equivalence_id || manifest.equivalence_id !== pkg) {
      errors.push({ package: pkg, code: 'PKG_SCHEMA_INVALID', message: 'equivalence_id divergente do nome do diretorio' })
      continue
    }

    if (!Array.isArray(manifest.locales_present) || manifest.locales_present.length === 0) {
      errors.push({ package: pkg, code: 'PKG_LOCALE_MISMATCH', message: 'locales_present vazio ou ausente' })
      continue
    }

    for (const loc of manifest.locales_present) {
      const reviewedPath = path.join(pkgPath, loc, 'reviewed.md')
      const metadataPath = path.join(pkgPath, loc, 'metadata.json')
      const articlePath = path.join(pkgPath, loc, 'article.mdx')

      if (!fs.existsSync(reviewedPath)) {
        errors.push({ package: pkg, code: 'PKG_MISSING_REVIEWED_MD', message: `reviewed.md ausente para ${loc}` })
      }
      if (!fs.existsSync(metadataPath)) {
        errors.push({ package: pkg, code: 'PKG_MISSING_METADATA_JSON', message: `metadata.json ausente para ${loc}` })
      }
      if (!fs.existsSync(articlePath)) {
        errors.push({ package: pkg, code: 'PKG_MISSING_ARTICLE_MDX', message: `article.mdx ausente para ${loc}` })
      }
    }

    packagesValid++
  }

  return { errors, packagesTotal, packagesValid }
}

function main() {
  const { errors, packagesTotal, packagesValid } = validate()

  console.log(`[validate:stockpile] packages_total=${packagesTotal} valid=${packagesValid} errors=${errors.length}`)

  if (errors.length > 0) {
    for (const err of errors) {
      console.log(`[validate:stockpile] [${err.code}] ${err.package}: ${err.message}`)
    }
    process.exit(1)
  }

  console.log('[validate:stockpile] OK')
  process.exit(0)
}

main()
