/**
 * src/lib/blog/post-schema.ts
 * Schema Zod para frontmatter de posts MDX do blog quad-market.
 *
 * Independente do runtime Velite — pode ser importado em scripts standalone
 * (validate-frontmatter.ts, hreflang-validator.ts) e em testes unitários.
 *
 * INT-045: Isolamento por build locale.
 * INT-077: Frontmatter padronizado com hreflang_pair.
 */

import { z } from 'zod'
import type { SupportedLocale as ConfigSupportedLocale } from '@config/types'

// Re-exportar o tipo canônico de config/types para que consumidores
// deste módulo não precisem importar diretamente de @config/types.
export type { ConfigSupportedLocale as SupportedLocale }

// Schema de locale — corresponde ao tipo SupportedLocale de @config/types.
// SYNC: manter alinhado com config/types.ts SupportedLocale e velite.config.ts SUPPORTED_LOCALES
export const SupportedLocaleSchema = z.enum(['pt-BR', 'it-IT', 'en', 'es-ES'])

/** Schema de um par hreflang: locale de destino + slug do artigo correspondente. */
export const hreflangPairSchema = z.object({
  locale: SupportedLocaleSchema,
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug: lowercase alfanumérico com hífens',
    ),
})

export type HreflangPair = z.infer<typeof hreflangPairSchema>

/**
 * Schema completo para frontmatter de posts MDX.
 *
 * Campos obrigatórios: title, date, slug, locale, excerpt, tags.
 * Campos opcionais: coverImage, published, exclusive, hreflang_pair, author.
 *
 * superRefine valida:
 *   - exclusive=true NÃO pode ter hreflang_pair preenchido
 *   - hreflang_pair NÃO pode ter self-reference (locale == artigo.locale)
 *   - hreflang_pair NÃO pode ter locales duplicados
 */
export const PostFrontmatterSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Título é obrigatório')
      .max(120, 'Título máximo 120 chars'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
    slug: z
      .string()
      .min(1, 'Slug é obrigatório')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug: apenas letras, números e hífens',
      ),
    locale: SupportedLocaleSchema,
    excerpt: z
      .string()
      .min(50, 'Excerpt mínimo 50 chars')
      .max(300, 'Excerpt máximo 300 chars'),
    tags: z
      .array(z.string().min(1))
      .min(1, 'Pelo menos 1 tag')
      .max(10, 'Máximo 10 tags'),
    published: z.boolean().default(true),
    exclusive: z.boolean().default(false),
    hreflang_pair: z.array(hreflangPairSchema).default([]),
    coverImage: z.string().optional(),
    author: z.string().default('Pedro Corgnati'),
  })
  .superRefine((data, ctx) => {
    // exclusive + hreflang_pair são mutuamente exclusivos
    if (data.exclusive && data.hreflang_pair.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Artigos exclusive não devem ter hreflang_pair',
        path: ['hreflang_pair'],
      })
    }

    // Self-reference proibida
    for (let i = 0; i < data.hreflang_pair.length; i++) {
      if (data.hreflang_pair[i]!.locale === data.locale) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `hreflang_pair[${i}] self-reference proibida — locale "${data.locale}"`,
          path: ['hreflang_pair', i, 'locale'],
        })
      }
    }

    // Locales duplicados em hreflang_pair proibidos
    const seen = new Set<string>()
    for (let i = 0; i < data.hreflang_pair.length; i++) {
      const loc = data.hreflang_pair[i]!.locale
      if (seen.has(loc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Locale duplicado "${loc}" em hreflang_pair`,
          path: ['hreflang_pair', i, 'locale'],
        })
      }
      seen.add(loc)
    }
  })

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>
