import type { MetadataRoute } from 'next'
import { blog as articles } from '@/.velite'
import { ServiceCategory } from '@/lib/types'
import { ROUTES, SITE } from '@/lib/constants'

/**
 * app/sitemap.ts — Sitemap XML automático via Next.js App Router.
 *
 * INT-051: Sitemap XML automático gerado a cada build.
 * FEAT-BL-006: Inclui todas as rotas: home, serviços, portfólio, blog, artigos, categorias.
 *
 * Compatível com `output: 'export'` — usa import estático do Velite.
 *
 * Prioridades:
 *   1.0 — Home
 *   0.9 — /servicos, /blog
 *   0.8 — /servicos/{slug}
 *   0.7 — /portfolio, /blog/{slug}
 *   0.5 — /blog/categoria/{cat}
 */

export const dynamic = 'force-static'

function getSiteUrl(): string {
  return SITE.url
}

export default function sitemap(): MetadataRoute.Sitemap {
  const services = Object.values(ServiceCategory)
  const baseUrl = getSiteUrl()

  // Rotas estáticas com prioridades
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}${ROUTES.SERVICES}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}${ROUTES.PORTFOLIO}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}${ROUTES.BLOG}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // 11 páginas de serviço (priority: 0.8)
  const serviceRoutes: MetadataRoute.Sitemap = services.map(slug => ({
    url: `${baseUrl}${ROUTES.SERVICE(slug)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Artigos do blog (priority: 0.7, lastModified = data do artigo)
  const articleRoutes: MetadataRoute.Sitemap = articles.map(article => ({
    url: `${baseUrl}${ROUTES.BLOG_POST(article.slug)}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Categorias únicas dos artigos (priority: 0.5)
  const categories = [...new Set(articles.flatMap(a => a.tags))]
  const categoryRoutes: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${baseUrl}${ROUTES.BLOG_CATEGORY(encodeURIComponent(cat))}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...articleRoutes,
    ...categoryRoutes,
  ]
}
