/**
 * scripts/validate-frontmatter.ts — ATUALIZADO em module-2/TASK-2/ST006
 * Agora usa ArticleFrontmatterSchema completo de lib/schemas.ts
 */
import { glob } from 'glob'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { validateArticle } from '../src/lib/schemas'

async function validateFrontmatter(): Promise<void> {
  const files = await glob('content/blog/**/*.mdx')

  if (files.length === 0) {
    console.log('[validate-frontmatter] Nenhum artigo encontrado — OK.')
    process.exit(0)
  }

  let hasErrors = false
  let validated = 0

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const { data } = matter(content)

    // Verificar que slug no frontmatter corresponde ao nome do arquivo
    const filenameSlug = path.basename(file, '.mdx')
    if (data.slug && data.slug !== filenameSlug) {
      console.error(`\n[validate-frontmatter] ✗ ${file}:`)
      console.error(`  - slug: slug "${data.slug}" não corresponde ao nome do arquivo "${filenameSlug}"`)
      hasErrors = true
      continue
    }

    const result = validateArticle(data)

    if (!result.success) {
      hasErrors = true
      const filename = path.relative(process.cwd(), file)
      console.error(`\n[validate-frontmatter] ✗ ${filename}:`)
      result.errors?.forEach(e => console.error(`  - ${e}`))
    } else {
      console.log(`[validate-frontmatter] ✓ ${path.relative(process.cwd(), file)}`)
      validated++
    }
  }

  if (hasErrors) {
    console.error(`\n[validate-frontmatter] FALHOU — ${validated} válidos, alguns com erros. Corrija antes do deploy.`)
    process.exit(1)
  }

  console.log(`\n[validate-frontmatter] ✓ ${validated} artigos válidos.`)
  process.exit(0)
}

validateFrontmatter()
