/**
 * src/components/seo/JsonLdService.tsx
 * Service schema para páginas de serviço.
 *
 * Uso:
 *   <JsonLdService
 *     name="SaaS Development"
 *     description="Full-stack SaaS development with React, Node.js, and cloud infrastructure"
 *     provider={{ name: "SystemForge", url: "https://forjadesistemas.com.br" }}
 *     areaServed={["BR", "IT", "US"]}
 *     url="https://forjadesistemas.com.br/servicos/saas"
 *   />
 */

interface ServiceProvider {
  name: string
  url: string
}

interface JsonLdServiceProps {
  name: string
  description: string
  provider: ServiceProvider
  areaServed: string[]
  url: string
  priceRange?: string
  image?: string
}

export function JsonLdService({
  name,
  description,
  provider,
  areaServed,
  url,
  priceRange = "Variable",
  image,
}: JsonLdServiceProps) {
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider.name,
      url: provider.url,
    },
    areaServed: areaServed.map((area) => ({
      '@type': 'Country',
      name: area,
    })),
    url,
    priceRange,
    ...(image && { image }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      suppressHydrationWarning
    />
  )
}
