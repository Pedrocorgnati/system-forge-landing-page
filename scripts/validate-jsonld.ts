/**
 * scripts/validate-jsonld.ts
 * Valida schemas JSON-LD nos arquivos HTML das builds estáticas.
 *
 * Lê arquivos HTML de out-br/, out-it/, out-en/, extrai <script type="application/ld+json">,
 * valida JSON.parse e campos obrigatórios por @type.
 *
 * Usage:
 *   npx tsx scripts/validate-jsonld.ts
 *
 * Exit codes:
 *   0 — todos os schemas válidos
 *   1 — erros encontrados
 *
 * INT-028, module-12-compliance-seo
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const BUILD_DIRS: Record<string, string> = {
  br: 'out-br',
  it: 'out-it',
  en: 'out-en',
}

const REQUIRED_FIELDS: Record<string, string[]> = {
  Organization: ['name', 'url', 'contactPoint'],
  LocalBusiness: ['name', 'url', 'areaServed'],
  BlogPosting: ['headline', 'author', 'datePublished', 'publisher'],
  Article: ['headline', 'author', 'datePublished', 'publisher'],
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface ValidationResult {
  market: string
  file: string
  schemaType: string
  pass: boolean
  errors: string[]
}

// ---------------------------------------------------------------------------
// Extrai todos os blocos JSON-LD de um HTML
// ---------------------------------------------------------------------------

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = []
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    blocks.push(match[1].trim())
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Valida campos obrigatórios por @type
// ---------------------------------------------------------------------------

function validateSchema(schema: Record<string, unknown>, filePath: string, market: string): ValidationResult[] {
  const schemaType = schema['@type'] as string | undefined
  if (!schemaType) {
    return [{
      market,
      file: filePath,
      schemaType: 'unknown',
      pass: false,
      errors: ['Campo @type ausente no schema JSON-LD'],
    }]
  }

  const requiredFields = REQUIRED_FIELDS[schemaType]
  if (!requiredFields) {
    // Tipo desconhecido — só valida que é JSON válido
    return [{
      market,
      file: filePath,
      schemaType,
      pass: true,
      errors: [],
    }]
  }

  const missingFields = requiredFields.filter(field => !(field in schema))

  return [{
    market,
    file: filePath,
    schemaType,
    pass: missingFields.length === 0,
    errors: missingFields.map(f => `Campo obrigatório ausente: "${f}" (tipo: ${schemaType})`),
  }]
}

// ---------------------------------------------------------------------------
// Processa todos os arquivos HTML de um diretório
// ---------------------------------------------------------------------------

function processDirectory(market: string, dir: string): ValidationResult[] {
  const results: ValidationResult[] = []

  if (!fs.existsSync(dir)) {
    console.error(`  ❌ Build output não encontrado: ${dir}/`)
    process.exitCode = 1
    return results
  }

  const htmlFiles = findHtmlFiles(dir)

  for (const filePath of htmlFiles) {
    const html = fs.readFileSync(filePath, 'utf-8')
    const blocks = extractJsonLdBlocks(html)
    const relPath = path.relative(dir, filePath)

    for (const block of blocks) {
      let parsed: Record<string, unknown>

      try {
        parsed = JSON.parse(block) as Record<string, unknown>
      } catch (err) {
        results.push({
          market,
          file: relPath,
          schemaType: 'parse-error',
          pass: false,
          errors: [`JSON inválido: ${(err as Error).message}`],
        })
        continue
      }

      const schemaResults = validateSchema(parsed, relPath, market)
      results.push(...schemaResults)
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Busca recursiva de arquivos .html
// ---------------------------------------------------------------------------

function findHtmlFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath)
    }
  }

  return files
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('=============================================')
  console.log('  JSON-LD Validator — Triple-Market')
  console.log('=============================================\n')

  const allResults: ValidationResult[] = []

  for (const [market, dir] of Object.entries(BUILD_DIRS)) {
    const fullDir = path.resolve(process.cwd(), dir)
    console.log(`Validando ${market.toUpperCase()} (${dir}/)...`)
    const results = processDirectory(market, fullDir)
    allResults.push(...results)
    console.log(`  ${results.length} schemas encontrados`)
  }

  console.log('')

  const failures = allResults.filter(r => !r.pass)
  const successes = allResults.filter(r => r.pass)

  // Gerar relatório JSON
  const report = {
    generatedAt: new Date().toISOString(),
    total: allResults.length,
    passed: successes.length,
    failed: failures.length,
    totalErrors: failures.reduce((sum, r) => sum + r.errors.length, 0),
    results: allResults,
  }

  const reportPath = path.resolve(process.cwd(), 'scripts', 'validate-jsonld-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`Relatório salvo em: ${reportPath}\n`)

  if (failures.length === 0) {
    console.log(`✅ Todos os ${successes.length} schemas JSON-LD são válidos.\n`)
    process.exit(0)
  }

  console.error(`❌ ${failures.length} schema(s) com falha:\n`)
  for (const result of failures) {
    console.error(`  [${result.market}] ${result.file} (@type: ${result.schemaType})`)
    for (const error of result.errors) {
      console.error(`    → ${error}`)
    }
    console.error('')
  }

  process.exit(1)
}

main()
