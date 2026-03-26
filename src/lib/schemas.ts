/**
 * lib/schemas.ts
 * Schemas Zod para validação de dados do site.
 *
 * Relação com lib/types.ts:
 * - ArticleFrontmatterSchema → valida ArticleFrontmatter
 * - z.infer<typeof ArticleFrontmatterSchema> === ArticleFrontmatter (devem ser idênticos)
 *
 * Regra: Sempre que adicionar campo em ArticleFrontmatter (types.ts),
 * adicionar também em ArticleFrontmatterSchema (schemas.ts).
 */
import { z } from 'zod'
import { ServiceCategory, ConversionAction, TechTag } from './types'
import type { ArticleFrontmatter, CTAConfig } from './types'

// ===== Article Frontmatter =====

export const ArticleFrontmatterSchema = z
  .object({
    // Título: ≤60 chars para SEO ideal (INT-054)
    title: z
      .string()
      .min(1, 'Título é obrigatório')
      .max(60, 'Título deve ter no máximo 60 caracteres para SEO'),

    // Slug: kebab-case, sem caracteres especiais
    slug: z
      .string()
      .min(1, 'Slug é obrigatório')
      .regex(/^[a-z0-9-]+$/, 'Slug deve ser kebab-case (apenas letras minúsculas, números e hífens)'),

    // Data: YYYY-MM-DD
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),

    // Descrição: ≤160 chars para meta description ideal (INT-054)
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(160, 'Descrição deve ter no máximo 160 caracteres para SEO'),

    // Tags: ao menos 1 (INT-044: toda categoria deve ter ao menos 1 artigo)
    tags: z
      .array(z.string().min(1))
      .min(1, 'Ao menos 1 tag é obrigatória'),

    // Cover image: deve ser path relativo em /images/ (INT-049)
    coverImage: z
      .string()
      .startsWith('/images/', 'coverImage deve ser um path relativo começando com /images/'),

    // Autor: Pedro Corgnati por padrão
    author: z
      .string()
      .default('Pedro Corgnati'),

    // Serviço relacionado: opcional, limita a categorias válidas
    relatedService: z
      .nativeEnum(ServiceCategory, {
        errorMap: () => ({ message: `relatedService deve ser um dos valores: ${Object.values(ServiceCategory).join(', ')}` }),
      })
      .optional(),
  })
  .refine(
    // INT-045: data não pode ser futura
    (data) => {
      const articleDate = new Date(data.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // fim do dia atual
      return articleDate <= today
    },
    {
      message: 'A data do artigo não pode ser futura',
      path: ['date'],
    }
  )
  .refine(
    // Slug deve ter ao menos 3 caracteres
    (data) => data.slug.length >= 3,
    {
      message: 'Slug deve ter ao menos 3 caracteres',
      path: ['slug'],
    }
  )

export type ArticleFrontmatterInput = z.input<typeof ArticleFrontmatterSchema>
export type ArticleFrontmatterOutput = z.output<typeof ArticleFrontmatterSchema>

// ===== Service Category =====

export const ServiceCategorySchema = z.nativeEnum(ServiceCategory, {
  errorMap: (issue) => {
    if (issue.code === 'invalid_enum_value') {
      return {
        message: `Categoria inválida: "${issue.received}". Categorias válidas: ${Object.values(ServiceCategory).join(', ')}`,
      }
    }
    return { message: 'Categoria de serviço inválida' }
  },
})

// ===== Tech Tag =====

export const TechTagSchema = z.nativeEnum(TechTag, {
  errorMap: () => ({
    message: `TechTag inválida. Valores válidos: ${Object.values(TechTag).join(', ')}`,
  }),
})

// ===== CTA Config =====

export const CTAConfigSchema = z.object({
  action: z.nativeEnum(ConversionAction, {
    errorMap: () => ({ message: 'ConversionAction inválido: use whatsapp, calendly ou budget-engine' }),
  }),
  label: z.string().min(1, 'Label do CTA é obrigatório'),
  href: z
    .string()
    .min(1, 'href é obrigatório')
    .refine(
      (href) => href.startsWith('/') || /^https?:\/\//.test(href),
      'href deve ser path relativo (/) ou URL absoluta (https://)'
    ),
  context: z.string().optional(),
})

// ===== Type Guards =====

/**
 * Verifica se um objeto desconhecido é um ArticleFrontmatter válido.
 * Uso: if (isValidArticle(data)) { ... }
 */
export function isValidArticle(data: unknown): data is ArticleFrontmatter {
  return ArticleFrontmatterSchema.safeParse(data).success
}

/**
 * Verifica se um objeto desconhecido é um CTAConfig válido.
 */
export function isValidCTAConfig(data: unknown): data is CTAConfig {
  return CTAConfigSchema.safeParse(data).success
}

/**
 * Valida ArticleFrontmatter e retorna erros detalhados.
 * Uso em scripts/validate-frontmatter.ts
 */
export function validateArticle(data: unknown): {
  success: boolean
  data?: ArticleFrontmatterOutput
  errors?: string[]
} {
  const result = ArticleFrontmatterSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  }
}
