/**
 * src/lib/blog/types.ts
 * Tipos TypeScript derivados do schema Zod (PostFrontmatterSchema).
 *
 * Regra: NÃO redefinir tipos manualmente — usar z.infer<> exclusivamente.
 * Campos computados (ComputedFields) são adicionados pelo Velite em build time
 * e NÃO estão presentes no frontmatter MDX.
 *
 * INT-077: Separação clara entre frontmatter validado e computed fields.
 */

import type { PostFrontmatter, HreflangPair, SupportedLocale } from './post-schema'

// Re-exportar tipos derivados do schema como fonte única de verdade.
export type { PostFrontmatter, HreflangPair, SupportedLocale }

/**
 * Campos adicionados pelo Velite em build time.
 * Estes campos NÃO vêm do arquivo .mdx — são calculados pelo transform.
 * Não incluir em PostFrontmatterSchema.
 */
export interface ComputedFields {
  /** Tempo estimado de leitura em minutos (baseado no wordCount). */
  readingTime: number
  /** Total de palavras do corpo do artigo. */
  wordCount: number
  /** URL canônica gerada pelo Velite: `/blog/${slug}`. */
  permalink: string
  /** HTML/JSX compilado do corpo MDX. */
  content: string
}
