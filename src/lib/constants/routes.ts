/**
 * lib/constants/routes.ts
 * Todas as rotas do site em um único objeto.
 * Usar ROUTES.X ao invés de strings hardcoded em Links/hrefs.
 */

export const ROUTES = {
  HOME: '/',
  home: '/',
  SERVICES: '/servicos',
  servicos: '/servicos',
  SERVICE: (slug: string) => `/servicos/${slug}`,
  service: (slug: string) => `/servicos/${slug}`,
  servicoSlug: (slug: string) => `/servicos/${slug}`,
  PORTFOLIO: '/portfolio',
  portfolio: '/portfolio',
  PORTFOLIO_PROJECT: (slug: string) => `/portfolio/${slug}`,
  portfolioProject: (slug: string) => `/portfolio/${slug}`,
  BLOG: '/blog',
  blog: '/blog',
  BLOG_POST: (slug: string) => `/blog/${slug}`,
  blogPost: (slug: string) => `/blog/${slug}`,
  blogSlug: (slug: string) => `/blog/${slug}`,
  BLOG_PAGE: (n: number) => `/blog/page/${n}`,
  blogPage: (n: number) => `/blog/page/${n}`,
  BLOG_CATEGORY: (cat: string) => `/blog/categoria/${cat}`,
  blogCategoria: (cat: string) => `/blog/categoria/${cat}`,
  BLOG_TAG: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
  blogTag: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
  PRIVACY: '/privacidade',
  privacidade: '/privacidade',
  NEWSLETTER_CONFIRMED: '/newsletter/confirmado',
  newsletterConfirmed: '/newsletter/confirmado',
  ADVISOR: '/conselheiro',
  conselheiro: '/conselheiro',
  SITEMAP: '/sitemap.xml',
  RSS: '/rss.xml',
  CONTACT: '/#contato',
  contato: '/#contato',
} as const

export type RouteKey = keyof typeof ROUTES
