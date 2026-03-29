import type { SiteConfig, SupportedLocale } from '@config/types'

interface Props {
  siteConfig: SiteConfig
}

const AREA_SERVED: Record<SupportedLocale, string> = {
  'pt-BR': 'Brasil',
  'it-IT': 'Italia',
  'en': 'International',
  'es-ES': 'España y Latinoamérica',
}

const SERVICE_TYPE: Record<SupportedLocale, string> = {
  'pt-BR': 'Desenvolvimento de Software',
  'it-IT': 'Sviluppo Software',
  'en': 'Software Development',
  'es-ES': 'Desarrollo de Software',
}

export function JsonLdLocalBusiness({ siteConfig }: Props) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.siteName,
    url: siteConfig.url,
    email: siteConfig.email,
    areaServed: AREA_SERVED[siteConfig.locale],
    priceRange: '$$',
    serviceType: SERVICE_TYPE[siteConfig.locale],
    inLanguage: siteConfig.locale,
  }

  if (siteConfig.address) {
    schema.address = {
      '@type': 'PostalAddress',
      addressCountry:
        siteConfig.locale === 'pt-BR' ? 'BR'
        : siteConfig.locale === 'it-IT' ? 'IT'
        : siteConfig.locale === 'es-ES' ? 'ES'
        : 'US',
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
