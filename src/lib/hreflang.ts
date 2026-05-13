import hreflangMap from '../../public/hreflang-map.json'

export interface HreflangEntry {
  hreflang: string
  href: string
}

/**
 * Retorna os links hreflang para um slug de artigo.
 * Usado em generateMetadata() de cada pagina de blog.
 */
export function getHreflangLinks(slug: string): HreflangEntry[] {
  const group = hreflangMap.groups.find(g =>
    Object.values(g.versions).some(url => url.endsWith(`/${slug}`))
  )

  if (!group) {
    // Artigo exclusivo deste locale — apenas self-reference
    const locale = process.env.NEXT_PUBLIC_LOCALE ?? 'en'
    const localeConfig = hreflangMap.locales[locale as keyof typeof hreflangMap.locales]
    if (!localeConfig) return []
    return [
      {
        hreflang: localeConfig.hreflang,
        href: `https://${localeConfig.domain}/blog/${slug}`,
      },
    ]
  }

  const links: HreflangEntry[] = Object.entries(group.versions).map(([locale, href]) => ({
    hreflang: hreflangMap.locales[locale as keyof typeof hreflangMap.locales]?.hreflang ?? locale,
    href,
  }))

  // x-default aponta para versao en
  if (group['x-default']) {
    links.push({ hreflang: 'x-default', href: group['x-default'] })
  }

  return links
}

/**
 * Formata links hreflang para uso em generateMetadata()
 * alternates.languages
 */
export function getHreflangAlternates(slug: string): Record<string, string> {
  const links = getHreflangLinks(slug)
  return links.reduce((acc, { hreflang, href }) => {
    acc[hreflang] = href
    return acc
  }, {} as Record<string, string>)
}
