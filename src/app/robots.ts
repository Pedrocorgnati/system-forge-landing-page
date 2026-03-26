import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'

/**
 * app/robots.ts — robots.txt via Next.js App Router.
 *
 * INT-051: robots.txt com referência ao sitemap.
 * Disallow /newsletter/confirmado (reservado para module-8).
 */

function getSiteUrl(): string {
  return SITE.url
}

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/newsletter/confirmado', // página de confirmação (module-8)
          '/_next/',                 // assets internos do Next.js
          '/static/',                // assets do Velite
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
