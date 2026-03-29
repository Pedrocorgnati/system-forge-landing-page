import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { SupportedLocale } from '@config/types'

export interface SearchIndexItem {
  slug: string
  title: string
  description: string
  tags: string[]
  date: string
  relatedService?: string
  locale: SupportedLocale
}

export interface SearchResult {
  item: SearchIndexItem
  score?: number
}

/**
 * Allowlist de locales permitidos para geração do search index.
 * Defesa contra path traversal caso NEXT_PUBLIC_LOCALE chegue corrompida.
 * Defesa: THREAT-MODEL T-009 (open redirect / path traversal via env).
 */
const ALLOWED_LOCALES: readonly SupportedLocale[] = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const

/**
 * Gera o search index filtrando apenas os artigos do locale informado.
 *
 * Lê `content/{locale}/blog/*.mdx`, extrai frontmatter e retorna array de SearchIndexItem.
 * Retorna `[]` silenciosamente se o diretório não existe (blog ainda vazio).
 *
 * @param locale - Locale ativo do build (SupportedLocale)
 * @returns Array de SearchIndexItem com campo `locale` preenchido
 * @throws Error se `locale` não estiver na allowlist (path traversal prevention)
 */
export function generateSearchIndex(locale: SupportedLocale): SearchIndexItem[] {
  // Validação de segurança: locale deve estar na allowlist antes de ser usado em path
  if (!ALLOWED_LOCALES.includes(locale)) {
    throw new Error(
      `[generateSearchIndex] Locale inválido: "${locale}". Valores permitidos: ${ALLOWED_LOCALES.join(', ')}`,
    )
  }

  const blogDir = path.join(process.cwd(), 'content', locale, 'blog')

  // Retorno defensivo — diretório de blog pode não existir ainda (module-6/7)
  if (!fs.existsSync(blogDir)) {
    return []
  }

  let files: string[]
  try {
    files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
  } catch {
    return []
  }

  const items: SearchIndexItem[] = []

  for (const file of files) {
    const filePath = path.join(blogDir, file)
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)

      const slug =
        typeof data.slug === 'string' && data.slug
          ? data.slug
          : file.replace(/\.(mdx?|md)$/, '')

      items.push({
        slug,
        title: typeof data.title === 'string' ? data.title : slug,
        description: typeof data.description === 'string' ? data.description : '',
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        date: typeof data.date === 'string' ? data.date : '',
        relatedService:
          typeof data.relatedService === 'string' ? data.relatedService : undefined,
        locale,
      })
    } catch {
      // Arquivo ilegível: ignorar silenciosamente
    }
  }

  return items
}

/**
 * Remove PII de queries de busca antes de enviar ao GA4.
 * Substitui emails, CPFs, CNPJs e telefones por [REDACTED].
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    // Email
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]')
    // CPF: 000.000.000-00 ou 00000000000
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED]')
    // CNPJ: 00.000.000/0000-00 ou 00000000000000
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\.?\d{4}-?\d{2}\b/g, '[REDACTED]')
    // Telefone BR: (11) 99999-9999 ou 11999999999
    .replace(/\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}\b/g, '[REDACTED]')
    // Cartão de crédito (16 dígitos)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED]')
    .trim()
}
