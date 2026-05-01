import { defineCollection, defineConfig, s } from 'velite'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { ServiceCategory } from './src/lib/types'

// Build-time cover fallback (espelha src/lib/blog/cover-fallback.ts).
// Mantido inline porque velite roda fora do bundler do Next; importar via
// alias '@/...' não funciona aqui.
const NEUTRAL_COVER_FALLBACKS = [
  '/images/blog/fallbacks/neutral-1.png',
  '/images/blog/fallbacks/neutral-2.png',
  '/images/blog/fallbacks/neutral-3.png',
  '/images/blog/fallbacks/neutral-4.png',
  '/images/blog/fallbacks/neutral-5.png',
  '/images/blog/fallbacks/neutral-6.png',
  '/images/blog/fallbacks/neutral-7.png',
  '/images/blog/fallbacks/neutral-8.png',
] as const
const LAST_RESORT_COVER = '/images/blog/default-cover.png'

function pickFallbackForSlug(slug: string): string {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0
  return NEUTRAL_COVER_FALLBACKS[Math.abs(h) % NEUTRAL_COVER_FALLBACKS.length]!
}

// Resolve coverImage para um caminho que existe em public/. Caminhos remotos
// (http/https) passam direto. Caminhos relativos ao site root ('/...') são
// validados contra public/; ausentes caem no fallback determinístico por slug,
// e em último caso no default-cover. Necessário porque com output:'export' +
// images.unoptimized, o onError client-side de BlogCoverImage não dispara antes
// de a 404 já ter "queimado" o <img> SSR'd.
// Schema default usado quando frontmatter omite coverImage — tratamos como
// "missing" para forçar variedade visual via neutral-N em vez de uma única capa.
const SCHEMA_DEFAULT_COVER = '/images/blog/default-cover.png'

function resolveCoverImage(cover: string, slug: string): string {
  if (/^https?:\/\//i.test(cover)) return cover
  if (cover !== SCHEMA_DEFAULT_COVER) {
    // decodeURIComponent normaliza %20/unicode antes do existsSync — caminho
    // servido pelo Next em runtime já é o decodificado.
    let decoded: string
    try {
      decoded = decodeURIComponent(cover)
    } catch {
      decoded = cover
    }
    const publicPath = path.join(process.cwd(), 'public', decoded.replace(/^\//, ''))
    if (existsSync(publicPath)) return cover
  }
  const fallback = pickFallbackForSlug(slug)
  const fallbackFs = path.join(process.cwd(), 'public', fallback.replace(/^\//, ''))
  return existsSync(fallbackFs) ? fallback : LAST_RESORT_COVER
}

/**
 * velite.config.ts — Configuração locale-aware do pipeline MDX.
 *
 * Build isolation por locale: cada build lê apenas o subdiretório do locale ativo.
 * NEXT_PUBLIC_LOCALE determina qual pasta de conteúdo é usada.
 *
 * THREAT-MODEL T-001: XSS via MDX — mitigado via rehype-sanitize com allowlist.
 * INT-045: Isolamento por build locale.
 * INT-077: Frontmatter padronizado com hreflang_pair.
 */

// ---------------------------------------------------------------------------
// Locale detection + validation
// ---------------------------------------------------------------------------

// SYNC: manter alinhado com config/index.ts SUPPORTED_LOCALES e config/types.ts SupportedLocale.
// Não é possível importar de config/ pois SupportedLocale[] não é compatível com `as const`
// requerido por s.enum(). Se um novo locale for adicionado, atualizar AMBOS os arquivos.
const SUPPORTED_LOCALES = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: SupportedLocale = 'pt-BR'

const locale: SupportedLocale =
  (process.env.NEXT_PUBLIC_LOCALE as SupportedLocale) || DEFAULT_LOCALE

if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
  throw new Error(
    `[velite] Locale "${locale}" não suportado. Suportados: ${SUPPORTED_LOCALES.join(', ')}`
  )
}

const WORDS_PER_MINUTE = 200

// ---------------------------------------------------------------------------
// rehype-sanitize allowlist (THREAT-MODEL T-001)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ServiceCategory enum values (INT-095: CTAs contextualizados)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// hreflang pair sub-schema (inline — mirrors PostFrontmatterSchema)
// ---------------------------------------------------------------------------

const hreflangPairSchema = s.object({
  locale: s.enum(SUPPORTED_LOCALES as unknown as [string, ...string[]]),
  slug: s.string(),
})

// ---------------------------------------------------------------------------
// Posts collection — locale-scoped
// ---------------------------------------------------------------------------

const posts = defineCollection({
  name: 'Post',
  pattern: `${locale}/blog/**/*.mdx`,
  schema: s
    .object({
      // Title: ≤120 chars (SEO, INT-054)
      title: s.string().max(120),
      // Date: ISO 8601 (INT-045)
      date: s.isodate(),
      // Slug: kebab-case, unique within collection
      slug: s.slug('posts'),
      // Locale: must match the build locale (validated at build time)
      locale: s.enum(SUPPORTED_LOCALES as unknown as [string, ...string[]]),
      // Excerpt: ≤300 chars (meta description + listing pages)
      excerpt: s.string().max(300),
      // Tags: 1–10 tags (INT-046)
      tags: s.array(s.string()).min(1).max(10),
      // Published: false = draft (não indexado)
      published: s.boolean().default(true),
      // Exclusive: true = artigo existe apenas neste locale
      exclusive: s.boolean().default(false),
      // hreflang pairs para artigos universais (exclusive=false)
      hreflang_pair: s.array(hreflangPairSchema).default([]),
      // Cover image: default se não especificado
      coverImage: s.string().default('/images/blog/default-cover.png'),
      // Autor: default para o autor principal
      author: s.string().default('Pedro Corgnati'),
      // Serviço relacionado: CTAs contextualizados (INT-095) — opcional
      relatedService: s.enum(serviceCategoryValues).optional(),
      // Conteúdo MDX compilado com rehype-sanitize
      // copyLinkedFiles:false — blog images live in public/static, not as relative MDX assets
      content: s.mdx({ copyLinkedFiles: false }),
      // Raw content (stripped in transform — used for word count)
      _raw: s.raw(),
    })
    .transform(data => {
      // Strip YAML frontmatter from raw content to count body words only
      const bodyRaw = data._raw.replace(/^---[\s\S]*?---\n?/, '')
      const words = bodyRaw.trim().split(/\s+/).filter(Boolean).length
      // Omit _raw from output (internal field)
      const { _raw, ...rest } = data
      return {
        ...rest,
        coverImage: resolveCoverImage(data.coverImage, data.slug),
        readingTime: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
        wordCount: words,
        permalink: `/blog/${data.slug}`,
        // description: backward compat with existing blog components that use article.description
        description: data.excerpt,
      }
    }),
  mdx: {
    // Disable file copying: blog images live in public/static, not as relative MDX assets.
    // Prevents EISDIR when MDX contains site-root links like [text](/).
    copyLinkedFiles: false,
    rehypePlugins: [
      // XSS prevention: remove <script>, on* attrs, javascript: hrefs
      [rehypeSanitize, sanitizeSchema],
    ],
    remarkPlugins: [remarkGfm],
  },
})

// ---------------------------------------------------------------------------
// Velite config
// ---------------------------------------------------------------------------

export default defineConfig({
  root: 'content',
  output: {
    data: '.velite',
    assets: 'public/static',
    base: '/static/',
    name: '[name]-[hash:6].[ext]',
    clean: true,
  },
  // 'blog' key preserves backward compat: import { blog } from '@/.velite'
  collections: { blog: posts },
})
