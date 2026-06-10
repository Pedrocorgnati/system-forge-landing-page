interface JsonLdWebPageProps {
  url: string
  name: string
  description: string
  inLanguage: string
  isPartOf: {
    name: string
    url: string
  }
  primaryImageOfPage?: string
}

export function JsonLdWebPage({
  url,
  name,
  description,
  inLanguage,
  isPartOf,
  primaryImageOfPage,
}: JsonLdWebPageProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage,
    isPartOf: {
      '@type': 'WebSite',
      name: isPartOf.name,
      url: isPartOf.url,
    },
  }
  if (primaryImageOfPage) {
    schema.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: primaryImageOfPage,
    }
  }

  const safeJson = JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}
