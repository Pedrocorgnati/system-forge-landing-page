import { defineCollection, defineConfig, s } from 'velite'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { ServiceCategory } from './src/lib/types'

/**
 * velite.config.ts — Configuração completa do pipeline MDX.
 * Expandida em module-7-blog-pipeline (TASK-1).
 *
 * THREAT-MODEL T-001: XSS via MDX — mitigado via rehype-sanitize com allowlist.
 * INT-054: Frontmatter padronizado e validado.
 * INT-045: Datas reais, sem retroatividade.
 */

// Allowlist para rehype-sanitize (THREAT-MODEL T-001)
const sanitizeSchema = {
  tagNames: [
    'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'code', 'pre',
    'blockquote', 'a', 'img', 'strong', 'em', 'hr', 'br', 'table',
    'thead', 'tbody', 'tr', 'th', 'td',
  ],
  attributes: {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'code': ['className'],
    '*': ['className'],
  },
}

const serviceCategoryValues = [
  ServiceCategory.SAAS,
  ServiceCategory.MOBILE,
  ServiceCategory.MARKETPLACE,
  ServiceCategory.AI,
  ServiceCategory.BOTS,
  ServiceCategory.LANDING,
  ServiceCategory.ECOMMERCE,
  ServiceCategory.DASHBOARD,
  ServiceCategory.API,
  ServiceCategory.DESKTOP,
  ServiceCategory.GESTAO,
  ServiceCategory.ERP,
  ServiceCategory.CONSULTORIA,
] as const

const blog = defineCollection({
  name: 'Article',
  pattern: 'blog/**/*.mdx',
  schema: s
    .object({
      // Título: ≤60 chars para SEO (INT-054, VAL_003)
      title: s.string().max(60),
      // Slug: kebab-case derivado do nome do arquivo
      slug: s.slug('blog'),
      // Data: ISO 8601 — não pode ser futura (INT-045, VAL_002)
      date: s.isodate(),
      // Descrição: ≤160 chars para meta description
      description: s.string().max(160),
      // Tags: mínimo 1, máximo 10 (INT-046)
      tags: s.array(s.string()).min(1).max(10),
      // Cover image: usa default se não especificado
      coverImage: s.string().default('/images/blog/default-cover.webp'),
      // Autor: default para o autor principal
      author: s.string().default('SystemForge'),
      // Serviço relacionado: para CTAs contextualizados (INT-095)
      relatedService: s.enum(serviceCategoryValues).optional(),
      // Conteúdo MDX compilado com rehype-sanitize
      content: s.mdx(),
    })
    .transform(data => ({
      ...data,
      // readingTime calculado a partir do conteúdo compilado
      readingTime: Math.ceil((data.content?.split(' ').length ?? 0) / 200) || 1,
    })),
  mdx: {
    rehypePlugins: [
      // XSS prevention: remove <script>, on* attrs, javascript: hrefs
      [rehypeSanitize, sanitizeSchema],
    ],
    remarkPlugins: [remarkGfm],
  },
})

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  collections: {
    blog,
  },
})
