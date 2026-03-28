/**
 * src/lib/seo/build-alternates.ts
 * Helpers para construir hreflang alternates em sitemaps e generateMetadata().
 *
 * INT-019, INT-020 — Hreflang multi-domain com x-default → EN.
 * NEXT-005 — Reciprocidade hreflang (guardrail).
 *
 * Fonte canônica de domínios: LOCALE_URLS de @config.
 * Fonte canônica de slugs:    ROUTE_SLUGS de @/lib/locale-slugs.
 */
import type { SupportedLocale } from '@config/types'
import { LOCALE_URLS, SUPPORTED_LOCALES } from '@config'
import { HREFLANG_CODE, DEFAULT_LOCALE } from '@/types/hreflang.types'
import type { ArticleHreflang } from '@/types/hreflang.types'
import { ROUTE_SLUGS } from '@/lib/locale-slugs'
import type { RouteKey } from '@/lib/locale-slugs'

/**
 * Remove trailing slash de uma URL base, evitando double-slash.
 */
function normalizeBase(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/**
 * Constrói o objeto `languages` para `MetadataRoute.Sitemap alternates`
 * ou `generateMetadata().alternates.languages` para uma página institucional.
 *
 * Para rotas institucionais (home, services, blog, etc.):
 * usa ROUTE_SLUGS para obter o slug equivalente por locale.
 *
 * @param routeKey  Chave semântica da rota (ex: 'services', 'about')
 * @returns         Record<hreflangCode, absoluteUrl> incluindo x-default
 *
 * @example
 * buildLanguagesForRoute('services')
 * // {
 * //   'pt-BR': 'https://forjadesistemas.com.br/servicos',
 * //   'it':    'https://systemforge.it/servizi',
 * //   'en':    'https://systemforgesoftware.com/services',
 * //   'x-default': 'https://systemforgesoftware.com/services',
 * // }
 */
export function buildLanguagesForRoute(
  routeKey: RouteKey,
): Record<string, string> {
  const languages: Record<string, string> = {}

  for (const locale of SUPPORTED_LOCALES) {
    const slug = ROUTE_SLUGS[locale][routeKey]
    const base = normalizeBase(LOCALE_URLS[locale])
    const hreflang = HREFLANG_CODE[locale]
    languages[hreflang] = `${base}${slug === '/' ? '' : slug}`
  }

  // x-default → EN
  const enBase = normalizeBase(LOCALE_URLS[DEFAULT_LOCALE])
  const enSlug = ROUTE_SLUGS[DEFAULT_LOCALE][routeKey]
  languages['x-default'] = `${enBase}${enSlug === '/' ? '' : enSlug}`

  return languages
}

/**
 * Constrói o objeto `languages` para um artigo de blog universal.
 * Artigos exclusivos (exclusive: true) retornam `undefined` — sem hreflang.
 *
 * @param article   ArticleHreflang com localeSlugMap
 * @param basePath  Caminho base do blog (default: '/blog')
 * @returns         Record<hreflangCode, absoluteUrl> | undefined
 */
export function buildLanguagesForArticle(
  article: ArticleHreflang,
  basePath: string = '/blog',
): Record<string, string> | undefined {
  if (article.exclusive) return undefined

  const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  const languages: Record<string, string> = {}

  for (const locale of SUPPORTED_LOCALES) {
    const slug = article.localeSlugMap[locale]
    if (!slug) continue
    const domain = normalizeBase(LOCALE_URLS[locale])
    const hreflang = HREFLANG_CODE[locale]
    languages[hreflang] = `${domain}${cleanBase}/${slug}`
  }

  // x-default → versão EN (se existir)
  const enSlug = article.localeSlugMap[DEFAULT_LOCALE]
  const enDomain = normalizeBase(LOCALE_URLS[DEFAULT_LOCALE])
  if (enSlug) {
    languages['x-default'] = `${enDomain}${cleanBase}/${enSlug}`
  }

  // Sem alternates se apenas um locale
  const localeCount = Object.keys(languages).filter(k => k !== 'x-default').length
  if (localeCount <= 1) return undefined

  return languages
}

/**
 * URL canônica para a página no domínio ativo.
 * Útil para `alternates.canonical` em generateMetadata().
 *
 * @param path         Caminho relativo (ex: '/servicos')
 * @param activeLocale Locale do build atual (default: lido de getSiteConfig())
 */
export function getCanonicalUrl(path: string, activeLocale?: SupportedLocale): string {
  const locale = activeLocale ?? (process.env.NEXT_PUBLIC_LOCALE as SupportedLocale | undefined) ?? 'pt-BR'
  const base = normalizeBase(LOCALE_URLS[locale] ?? LOCALE_URLS['pt-BR'])
  return `${base}${path === '/' ? '' : path}`
}
