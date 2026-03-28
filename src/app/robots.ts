/**
 * src/app/robots.ts
 * robots.txt dinâmico via Next.js App Router.
 *
 * INT-020 — robots.txt aponta para sitemap do domínio ativo no build.
 * INT-051 — Sitemap URL dinâmica por locale.
 *
 * Cada build (build:br / build:it / build:en) gera robots.txt com
 * a URL de sitemap correta para o domínio ativo.
 */
import type { MetadataRoute } from 'next'
import { getSiteConfig } from '@config'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const config = getSiteConfig()

  // Normalizar base URL (remover trailing slash)
  const siteUrl = config.url.endsWith('/')
    ? config.url.slice(0, -1)
    : config.url

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',                     // rotas de API server-side
          '/_next/',                   // assets internos do Next.js
          '/admin/',                   // área administrativa (se existir)
          '/static/',                  // assets do Velite
          '/newsletter/confirmado',   // página de confirmação pós-opt-in (BR)
          '/newsletter/confermato',   // página de confirmação pós-opt-in (IT)
          '/newsletter/confirmed',    // página de confirmação pós-opt-in (EN)
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
