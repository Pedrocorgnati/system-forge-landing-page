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
import {
  isCanonicalService,
  normalizeRelatedService,
} from '../src/lib/blog/normalize-service'

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

// Drift NÃO-BLOQUEANTE: relatedService cru fora do enum canônico. Reportado como
// WARNING (não falha o build) — a normalização real roda no .transform() do
// velite. Surface a divergência do pipeline de conteúdo sem travar o CI.
const serviceDrift = new Map<string, { count: number; mappedTo: string }>()

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

  // Coleta drift de relatedService (não-bloqueante — ver serviceDrift acima).
  const rawService = data.relatedService
  if (typeof rawService === 'string' && rawService.trim() && !isCanonicalService(rawService)) {
    const mapped = normalizeRelatedService(rawService)
    const entry = serviceDrift.get(rawService) ?? {
      count: 0,
      mappedTo: mapped ?? 'undefined (CTA padrão)',
    }
    entry.count++
    serviceDrift.set(rawService, entry)
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

// WARNING não-bloqueante: drift de relatedService no pipeline de conteúdo.
if (serviceDrift.size > 0) {
  const total = [...serviceDrift.values()].reduce((sum, e) => sum + e.count, 0)
  console.warn(
    `\n⚠️  relatedService não-canônico em ${total} artigo(s) ${locale} ` +
      `(${serviceDrift.size} valor(es) distinto(s)) — normalizado no build, não bloqueia:`,
  )
  const sorted = [...serviceDrift.entries()].sort((a, b) => b[1].count - a[1].count)
  for (const [value, { count, mappedTo }] of sorted) {
    console.warn(`   - "${value}" ×${count} → ${mappedTo}`)
  }
  console.warn(
    '   Corrija na origem: a routine deve emitir slugs canônicos de ServiceCategory.',
  )
}
