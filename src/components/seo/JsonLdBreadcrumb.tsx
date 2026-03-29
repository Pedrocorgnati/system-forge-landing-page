/**
 * src/components/seo/JsonLdBreadcrumb.tsx
 * BreadcrumbList schema para rotas dinâmicas e multi-level.
 *
 * Uso:
 *   <JsonLdBreadcrumb items={[
 *     { label: 'Home', url: '/' },
 *     { label: 'Blog', url: '/blog' },
 *     { label: 'Artigo', url: '/blog/slug' }
 *   ]} />
 */

interface BreadcrumbItem {
  label: string
  url: string
}

interface JsonLdBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function JsonLdBreadcrumb({ items }: JsonLdBreadcrumbProps) {
  // Garantir que a URL é absoluta
  const ensureAbsoluteUrl = (url: string): string => {
    if (url.startsWith('http')) return url
    // No servidor, config.url já está disponível via getSiteConfig()
    // No cliente, URLs relativas funcionam normalmente no JSON-LD
    return url.startsWith('/') ? url : `/${url}`
  }

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: ensureAbsoluteUrl(item.url),
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      suppressHydrationWarning
    />
  )
}
