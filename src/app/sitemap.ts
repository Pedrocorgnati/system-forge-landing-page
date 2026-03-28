/**
 * src/app/sitemap.ts
 * Sitemap XML multi-domain com anotações hreflang (Next.js App Router).
 *
 * INT-019, INT-020 — Sitemap dinâmico por locale com hreflang cruzado.
 * NEXT-005 — Reciprocidade hreflang garantida via buildLanguagesForRoute().
 *
 * Cada build (build:br / build:it / build:en) gera seu próprio sitemap.xml
 * com hreflang apontando para os domínios dos outros 2 locales.
 *
 * Prioridades:
 *   1.0 — Home
 *   0.9 — /blog (alta frequência de atualização)
 *   0.8 — /services, /portfolio
 *   0.7 — /advisor, /blog/{artigos universais}
 *   0.6 — /contact, /about
 *   0.5 — /blog/{artigos exclusivos}
 *   0.4 — /privacy
 */
import type { MetadataRoute } from 'next'
import { getSiteConfig } from '@config'
import { ROUTE_SLUGS } from '@/lib/locale-slugs'
import { buildLanguagesForRoute, buildLanguagesForArticle } from '@/lib/seo/build-alternates'
import { HREFLANG_CODE, DEFAULT_LOCALE } from '@/types/hreflang.types'
import { LOCALE_URLS } from '@config'
import { getArticlesForLocale } from '@/lib/blog-articles'
import { ServiceCategory } from '@/lib/types'
import { SERVICE_SLUGS } from '@/lib/locale-slugs'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getSiteConfig()
  const activeLocale = config.locale
  const routes = ROUTE_SLUGS[activeLocale]

  // Fail-fast: validar que o domínio ativo está mapeado
  const activeDomain = LOCALE_URLS[activeLocale]
  if (!activeDomain) {
    throw new Error(
      `[sitemap.ts] Locale '${activeLocale}' não mapeado em LOCALE_URLS. ` +
      'Verifique config/index.ts',
    )
  }

  // Normalizar base URL (remover trailing slash)
  const base = activeDomain.endsWith('/') ? activeDomain.slice(0, -1) : activeDomain

  const now = new Date().toISOString().split('T')[0]
  const entries: MetadataRoute.Sitemap = []

  // -------------------------------------------------------------------------
  // Páginas institucionais
  // -------------------------------------------------------------------------

  const INSTITUTIONAL_ROUTES: Array<{
    key: keyof typeof routes
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { key: 'home',      changeFrequency: 'weekly',   priority: 1.0 },
    { key: 'blog',      changeFrequency: 'daily',    priority: 0.9 },
    { key: 'services',  changeFrequency: 'monthly',  priority: 0.8 },
    { key: 'portfolio', changeFrequency: 'monthly',  priority: 0.8 },
    { key: 'advisor',   changeFrequency: 'monthly',  priority: 0.7 },
    { key: 'contact',   changeFrequency: 'yearly',   priority: 0.6 },
    { key: 'about',     changeFrequency: 'yearly',   priority: 0.6 },
    { key: 'privacy',   changeFrequency: 'yearly',   priority: 0.4 },
  ]

  for (const route of INSTITUTIONAL_ROUTES) {
    const slug = routes[route.key]
    if (slug === undefined) continue

    entries.push({
      url: `${base}${slug === '/' ? '' : slug}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: buildLanguagesForRoute(route.key),
      },
    })
  }

  // -------------------------------------------------------------------------
  // Páginas de serviço (hreflang por categoria)
  // Usa chaves (SAAS, MOBILE, ...) para acessar SERVICE_SLUGS
  // -------------------------------------------------------------------------

  // Deduplicar slugs ativos para evitar entradas duplicadas (ex: BOTS/CHATBOT)
  const seenServiceUrls = new Set<string>()

  for (const categoryKey of Object.keys(ServiceCategory) as Array<keyof typeof SERVICE_SLUGS>) {
    const slugsMap = SERVICE_SLUGS[categoryKey]
    if (!slugsMap) continue

    const activeSlug = slugsMap[activeLocale]
    if (!activeSlug) continue

    const activeUrl = `${base}${activeSlug}`
    if (seenServiceUrls.has(activeUrl)) continue
    seenServiceUrls.add(activeUrl)

    // Construir languages para esta categoria de serviço
    const languages: Record<string, string> = {}
    for (const [locale, slug] of Object.entries(slugsMap) as Array<[keyof typeof HREFLANG_CODE, string]>) {
      const domain = LOCALE_URLS[locale]
      if (!domain || !slug) continue
      const hreflang = HREFLANG_CODE[locale]
      if (hreflang) {
        languages[hreflang] = `${domain.endsWith('/') ? domain.slice(0, -1) : domain}${slug}`
      }
    }
    // x-default → EN
    const enSlug = slugsMap[DEFAULT_LOCALE]
    const enDomain = LOCALE_URLS[DEFAULT_LOCALE]
    if (enSlug && enDomain) {
      languages['x-default'] = `${enDomain.endsWith('/') ? enDomain.slice(0, -1) : enDomain}${enSlug}`
    }

    entries.push({
      url: activeUrl,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages },
    })
  }

  // -------------------------------------------------------------------------
  // Artigos do blog (via Velite)
  // -------------------------------------------------------------------------

  const articles = getArticlesForLocale(activeLocale)

  for (const article of articles) {
    const articleSlug = article.localeSlugMap[activeLocale]
    if (!articleSlug) continue

    if (!article.exclusive) {
      // Artigo universal: com hreflang alternates
      const languages = buildLanguagesForArticle(article)
      entries.push({
        url: `${base}${routes.blog}/${articleSlug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
        ...(languages ? { alternates: { languages } } : {}),
      })
    } else {
      // Artigo exclusivo: sem hreflang
      entries.push({
        url: `${base}${routes.blog}/${articleSlug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
  }

  return entries
}

// -------------------------------------------------------------------------
// Exportar para uso em testes
// -------------------------------------------------------------------------

/**
 * Retorna o hreflang code para um dado SupportedLocale.
 * Exportado para facilitar testes unitários.
 */
export { HREFLANG_CODE, DEFAULT_LOCALE }
