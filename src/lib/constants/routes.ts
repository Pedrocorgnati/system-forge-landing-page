/**
 * lib/constants/routes.ts
 * Todas as rotas do site em um único objeto.
 * Usar ROUTES.X ao invés de strings hardcoded em Links/hrefs.
 */

export const ROUTES = {
  HOME: '/',
  SERVICES: '/servicos',
  SERVICE: (slug: string) => `/servicos/${slug}`,
  PORTFOLIO: '/portfolio',
  PORTFOLIO_PROJECT: (slug: string) => `/portfolio/${slug}`,
  BLOG: '/blog',
  BLOG_POST: (slug: string) => `/blog/${slug}`,
  BLOG_PAGE: (n: number) => `/blog/page/${n}`,
  BLOG_CATEGORY: (cat: string) => `/blog/categoria/${cat}`,
  BLOG_TAG: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
  PRIVACY: '/privacidade',
  NEWSLETTER_CONFIRMED: '/newsletter/confirmado',
  ADVISOR: '/conselheiro',
  SITEMAP: '/sitemap.xml',
  RSS: '/rss.xml',
  CONTACT: '/#contato',
} as const

export type RouteKey = keyof typeof ROUTES
