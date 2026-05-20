import { defineCollection, defineConfig, s } from 'velite'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { normalizeRelatedService } from './src/lib/blog/normalize-service'

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
 * THREAT-MODEL T-001: XSS via MDX — o conteúdo do blog é gerado por um pipeline
 *   automatizado confiável (routine Claude), não por submissão pública. NOTA: o
 *   bloco `sanitizeSchema` + `mdx:` da collection abaixo está INERTE (velite não
 *   lê `mdx` em defineCollection — ver comentário no bloco). Sanitização real
 *   exigiria mover a config para `s.mdx({...})` E removeria `<script>` JSON-LD e
 *   componentes `<FAQSchema>`/`<Callout>` — decisão de arquitetura pendente.
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
// ATENCAO: este schema esta INERTE — so e referenciado pelo bloco `mdx:` da
// collection abaixo, que o velite NAO le. Mantido como referencia da allowlist
// pretendida caso a sanitizacao seja wireada via `s.mdx({...})` no futuro.
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
  // LOCKSTEP: as regras de campo abaixo espelham PostFrontmatterSchema em
  // src/lib/blog/post-schema.ts (fonte da verdade — auto-publishable-blog.md §7.1).
  // Velite usa `s` (não o `z` canônico) e não pode importar o módulo Zod direto,
  // então os limites min/max são duplicados à mão. Mudar um lado exige mudar o
  // outro. Com `defineConfig({ strict: true })` (fim do arquivo) um doc que viola
  // este schema ABORTA o build — manter paridade com o canônico evita divergência
  // com o hard-fail de scripts/validate-frontmatter.ts, que corre antes no CI.
  schema: s
    .object({
      // Title: 1–120 chars (SEO, INT-054)
      title: s.string().min(1).max(120),
      // Date: ISO 8601 (INT-045)
      date: s.isodate(),
      // Slug: kebab-case, unique within collection
      slug: s.slug('posts'),
      // Locale: must match the build locale (validated at build time)
      locale: s.enum(SUPPORTED_LOCALES as unknown as [string, ...string[]]),
      // Excerpt: 50–300 chars (meta description + listing pages)
      excerpt: s.string().min(50).max(300),
      // Tags: 1–10 tags, cada uma não-vazia (INT-046)
      tags: s.array(s.string().min(1)).min(1).max(10),
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
      // Serviço relacionado: CTAs contextualizados (INT-095) — opcional.
      // RAW = s.string() (aceita qualquer valor) de propósito: o pipeline de
      // conteúdo escreve ~48 variantes não-canônicas nos 4 locales. Um
      // s.enum() aqui — com defineConfig({ strict: true }) — ABORTARIA o build;
      // sem strict, DESCARTARIA silenciosamente o post (404 em produção). O
      // .transform() abaixo normaliza para ServiceCategory canônico via
      // normalizeRelatedService(); valores ambíguos viram undefined (CTA
      // padrão). Ver src/lib/blog/normalize-service.ts.
      relatedService: s.string().optional(),
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
        // Normaliza relatedService cru -> ServiceCategory canônico | undefined.
        // Sobrescreve o valor string de ...rest para o tipo gerado casar com
        // Article.relatedService?: ServiceCategory (ArticlePage.tsx).
        relatedService: normalizeRelatedService(data.relatedService),
      }
    }),
  // BLOCO INERTE: `mdx` nao e uma chave valida de defineCollection — velite a
  // ignora silenciosamente. As opcoes de MDX que valem sao (a) as passadas para
  // `s.mdx({...})` no campo `content` acima e (b) `defineConfig({ mdx })` global.
  // Consequencia: rehype-sanitize NAO roda e remark-gfm vem do default do velite
  // (por isso as tabelas funcionam). Ver THREAT-MODEL T-001 no topo do arquivo.
  mdx: {
    copyLinkedFiles: false,
    rehypePlugins: [
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
  // strict: um MDX que falha a compilacao ou a validacao de schema ABORTA o
  // build (exit != 0) em vez de ser descartado com um warning. Sem isto, um post
  // quebrado some silenciosamente do .velite e vira 404 em producao com o build
  // verde — exatamente a falha que esta auditoria corrigiu. Ver
  // rules/auto-publishable-blog.md.
  strict: true,
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
