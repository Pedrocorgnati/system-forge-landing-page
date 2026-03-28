/**
 * scripts/hreflang-validator.ts
 * Validação bidirecional de hreflang entre pastas de locale do blog triple-market.
 *
 * Para cada artigo universal (exclusive=false), verifica:
 *   1. Frontmatter válido (PostFrontmatterSchema)
 *   2. Locale do frontmatter == locale da pasta
 *   3. Artigos exclusive NÃO têm hreflang_pair
 *   4. Slugs referenciados em hreflang_pair existem no locale de destino
 *   5. Referências bidirecionais (A→B implica B→A)
 *
 * Usage:
 *   tsx scripts/hreflang-validator.ts
 *
 * Exit codes:
 *   0 — todas as referências hreflang são válidas
 *   1 — erros de validação encontrados
 *
 * INT-045, INT-077
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import { globSync } from 'fast-glob'
import { PostFrontmatterSchema } from '@/lib/blog'
import type { SupportedLocale } from '@/lib/blog'

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'it-IT', 'en']
const CONTENT_ROOT = path.resolve(process.cwd(), 'content')
const BLOG_SUBFOLDER = 'blog'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface ParsedArticle {
  filePath: string
  folderLocale: SupportedLocale
  fileSlug: string
  frontmatter: Record<string, unknown>
}

interface ValidationError {
  file: string
  message: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function discoverArticles(): ParsedArticle[] {
  const articles: ParsedArticle[] = []

  for (const locale of SUPPORTED_LOCALES) {
    const blogDir = path.join(CONTENT_ROOT, locale, BLOG_SUBFOLDER)

    if (!fs.existsSync(blogDir)) {
      continue // pasta vazia ou inexistente — pular silenciosamente
    }

    const pattern = path.join(blogDir, '**/*.mdx').replace(/\\/g, '/')
    const files = globSync(pattern)

    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)

      const fileSlug = path.basename(filePath, '.mdx').toLowerCase().replace(/\s+/g, '-')

      articles.push({ filePath, folderLocale: locale, fileSlug, frontmatter: data })
    }
  }

  return articles
}

function buildSlugIndex(articles: ParsedArticle[]): Map<SupportedLocale, Set<string>> {
  const index = new Map<SupportedLocale, Set<string>>()
  for (const locale of SUPPORTED_LOCALES) index.set(locale, new Set())
  for (const article of articles) index.get(article.folderLocale)?.add(article.fileSlug)
  return index
}

function validate(articles: ParsedArticle[]): ValidationError[] {
  const errors: ValidationError[] = []
  const slugIndex = buildSlugIndex(articles)

  for (const article of articles) {
    const relativePath = path.relative(CONTENT_ROOT, article.filePath)

    // Step 1: Validar frontmatter contra PostFrontmatterSchema
    const parseResult = PostFrontmatterSchema.safeParse(article.frontmatter)

    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        errors.push({
          file: relativePath,
          message: `Schema error em "${issue.path.join('.')}": ${issue.message}`,
        })
      }
      continue // pular checks adicionais se schema inválido
    }

    const data = parseResult.data

    // Step 2: Locale do frontmatter deve corresponder à pasta
    if (data.locale !== article.folderLocale) {
      errors.push({
        file: relativePath,
        message: `Locale do frontmatter "${data.locale}" não corresponde ao locale da pasta "${article.folderLocale}".`,
      })
    }

    // Step 3: Artigos exclusive não devem ter hreflang_pair
    if (data.exclusive) {
      if (data.hreflang_pair.length > 0) {
        errors.push({
          file: relativePath,
          message: 'Artigo exclusive tem entradas em hreflang_pair. Remova-as ou defina exclusive=false.',
        })
      }
      continue
    }

    // Step 4: Validar cada entrada de hreflang_pair
    for (const pair of data.hreflang_pair) {
      const targetLocale = pair.locale as SupportedLocale
      const targetSlug = pair.slug
      const targetSlugs = slugIndex.get(targetLocale)

      if (!targetSlugs) {
        errors.push({
          file: relativePath,
          message: `hreflang_pair referencia locale "${targetLocale}" que não tem pasta de conteúdo.`,
        })
        continue
      }

      if (!targetSlugs.has(targetSlug)) {
        errors.push({
          file: relativePath,
          message: `hreflang_pair referencia slug "${targetSlug}" em "${targetLocale}", mas o arquivo não existe em ${path.join(targetLocale, BLOG_SUBFOLDER)}/`,
        })
      }
    }

    // Step 5: Validar referências bidirecionais
    for (const pair of data.hreflang_pair) {
      const targetLocale = pair.locale as SupportedLocale
      const targetSlug = pair.slug

      const targetArticle = articles.find(
        a => a.folderLocale === targetLocale && a.fileSlug === targetSlug,
      )
      if (!targetArticle) continue // já reportado como slug inexistente acima

      const targetParse = PostFrontmatterSchema.safeParse(targetArticle.frontmatter)
      if (!targetParse.success) continue // erros de schema já reportados

      const backReference = targetParse.data.hreflang_pair.find(
        p => p.locale === article.folderLocale && p.slug === article.fileSlug,
      )

      if (!backReference) {
        errors.push({
          file: relativePath,
          message: `Hreflang bidirecional ausente: este artigo referencia "${targetSlug}" em "${targetLocale}", mas o artigo de destino não faz back-reference para "${article.fileSlug}" em "${article.folderLocale}".`,
        })
      }
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('========================================')
  console.log('  Hreflang Validator — Blog Triple-Market')
  console.log('========================================\n')

  if (!fs.existsSync(CONTENT_ROOT)) {
    console.error(`Content root não encontrado: ${CONTENT_ROOT}`)
    process.exit(1)
  }

  const articles = discoverArticles()
  console.log(`Encontrados ${articles.length} artigos em ${SUPPORTED_LOCALES.length} locales.\n`)

  for (const locale of SUPPORTED_LOCALES) {
    const count = articles.filter(a => a.folderLocale === locale).length
    console.log(`  ${locale}: ${count > 0 ? `${count} artigos` : 'sem artigos (pasta vazia ou inexistente)'}`)
  }
  console.log('')

  if (articles.length === 0) {
    console.log('✅ Zero artigos — zero erros.\n')
    process.exit(0)
  }

  const errors = validate(articles)

  if (errors.length === 0) {
    console.log('✅ Todas as referências hreflang são válidas. Nenhum erro encontrado.\n')
    process.exit(0)
  }

  console.error(`❌ Encontrados ${errors.length} erro(s) de validação:\n`)
  errors.forEach((err, i) => {
    console.error(`  ${i + 1}. [${err.file}]`)
    console.error(`     ${err.message}\n`)
  })
  console.error('Corrija os erros acima e re-execute o validador.\n')
  process.exit(1)
}

main()
