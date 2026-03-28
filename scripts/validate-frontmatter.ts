/**
 * scripts/validate-frontmatter.ts — Validação Zod em build-time
 * Lê artigos do locale ativo (NEXT_PUBLIC_LOCALE), extrai frontmatter com gray-matter
 * e valida contra PostFrontmatterSchema. Falha o build com exit(1) se qualquer arquivo for inválido.
 *
 * Uso:
 *   NEXT_PUBLIC_LOCALE=pt-BR tsx scripts/validate-frontmatter.ts
 *   tsx scripts/validate-frontmatter.ts  (fallback: pt-BR)
 */
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { PostFrontmatterSchema } from '../src/lib/blog/post-schema'

const locale = process.env.NEXT_PUBLIC_LOCALE || 'pt-BR'
const blogDir = path.join(process.cwd(), 'content', locale, 'blog')

if (!fs.existsSync(blogDir)) {
  console.warn(`⚠️  Pasta ${blogDir} não encontrada — sem artigos para validar`)
  process.exit(0)
}

const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'))

if (files.length === 0) {
  console.log(`✅ Todos os 0 artigos ${locale} válidos`)
  process.exit(0)
}

let hasErrors = false
const errorsByFile = new Map<string, string[]>()

for (const file of files) {
  const filePath = path.join(blogDir, file)
  let data: Record<string, unknown>

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    data = matter(raw).data as Record<string, unknown>
  } catch (err) {
    errorsByFile.set(file, [`  - [parse] Erro ao parsear frontmatter: ${(err as Error).message}`])
    hasErrors = true
    continue
  }

  const result = PostFrontmatterSchema.safeParse(data)

  if (!result.success) {
    const msgs = result.error.issues.map(i => `  - [${i.path.join('.') || 'root'}] ${i.message}`)
    errorsByFile.set(file, msgs)
    hasErrors = true
  } else {
    console.log(`✓ ${file}`)
  }
}

if (hasErrors) {
  console.error('\n❌ Validação falhou:\n')
  for (const [file, msgs] of errorsByFile) {
    console.error(`❌ ${file}:`)
    msgs.forEach(m => console.error(m))
    console.error('')
  }
  console.error('❌ Corrija os erros acima antes de continuar o build')
  process.exit(1)
}

console.log(`\n✅ Todos os ${files.length} artigos ${locale} válidos`)
