import type { SiteConfig } from '@config/types'

interface Props {
  siteConfig: SiteConfig
}

export function JsonLdOrganization({ siteConfig }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.siteName,
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      url: `${siteConfig.url}/images/logo.png`,
    },
    description: siteConfig.description,
    founder: {
      '@type': 'Person',
      name: siteConfig.author,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: siteConfig.email,
      availableLanguage: siteConfig.htmlLang,
    },
    sameAs: [
      siteConfig.socialLinks.linkedin,
      siteConfig.socialLinks.github,
    ].filter(Boolean),
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
