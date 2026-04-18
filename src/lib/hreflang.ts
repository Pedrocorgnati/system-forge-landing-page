/**
 * src/lib/hreflang.ts
 * Helper para links hreflang cross-locale do blog quad-market.
 *
 * Gerado por /blog:hreflang-map em 2026-04-17.
 * Regenerar após cada /blog:deploy com novos artigos.
 *
 * INT-019, INT-020, INT-077
 */

import hreflangMap from '../../public/hreflang-map.json'

export interface HreflangEntry {
  hreflang: string
  href: string
}

/**
 * Retorna os links hreflang para um slug de artigo.
 * Usado em generateMetadata() de cada página de blog.
 *
 * @param slug - Slug do artigo no locale atual do build
 * @returns Array de HreflangEntry para uso em <link rel="alternate">
 */
export function getHreflangLinks(slug: string): HreflangEntry[] {
  const group = hreflangMap.groups.find((g) =>
    Object.values(g.versions).some((url) => url.endsWith(`/${slug}`)),
  )

  if (!group) {
    // Artigo exclusivo — apenas self-reference sem alternates
    const locale = process.env.NEXT_PUBLIC_LOCALE ?? 'en'
    const localeConfig =
      hreflangMap.locales[locale as keyof typeof hreflangMap.locales]
    if (!localeConfig) return []
    return [
      {
        hreflang: localeConfig.hreflang,
        href: `https://${localeConfig.domain}/blog/${slug}`,
      },
    ]
  }

  const links: HreflangEntry[] = Object.entries(group.versions).map(
    ([locale, href]) => ({
      hreflang:
        hreflangMap.locales[locale as keyof typeof hreflangMap.locales]
          ?.hreflang ?? locale,
      href,
    }),
  )

  // x-default aponta para versão en
  if (group['x-default']) {
    links.push({ hreflang: 'x-default', href: group['x-default'] })
  }

  return links
}

/**
 * Formata links hreflang para uso em generateMetadata() alternates.languages.
 *
 * @example
 * export async function generateMetadata({ params }) {
 *   return {
 *     alternates: {
 *       languages: getHreflangAlternates(params.slug),
 *     },
 *   }
 * }
 */
export function getHreflangAlternates(slug: string): Record<string, string> {
  const links = getHreflangLinks(slug)
  return links.reduce(
    (acc, { hreflang, href }) => {
      acc[hreflang] = href
      return acc
    },
    {} as Record<string, string>,
  )
}

/**
 * Retorna estatísticas de cobertura hreflang do mapa atual.
 */
export function getHreflangStats() {
  return hreflangMap.stats
}
