/**
 * lib/constants/routes.ts
 * Todas as rotas do site.
 * Delegam para getSiteConfig().routes — locale-aware desde i18n-triple-market.
 */
import { getSiteConfig } from '@config'

const r = getSiteConfig().routes

export const ROUTES = {
  HOME: r.home,
  home: r.home,
  SERVICES: r.services,
  servicos: r.services,
  SERVICE: r.service,
  service: r.service,
  servicoSlug: r.service,
  PORTFOLIO: r.portfolio,
  portfolio: r.portfolio,
  PORTFOLIO_PROJECT: r.portfolioProject,
  portfolioProject: r.portfolioProject,
  BLOG: r.blog,
  blog: r.blog,
  BLOG_POST: r.blogPost,
  blogPost: r.blogPost,
  blogSlug: r.blogPost,
  BLOG_PAGE: r.blogPage,
  blogPage: r.blogPage,
  BLOG_CATEGORY: r.blogCategory,
  blogCategoria: r.blogCategory,
  BLOG_TAG: r.blogTag,
  blogTag: r.blogTag,
  PRIVACY: r.privacy,
  privacidade: r.privacy,
  NEWSLETTER_CONFIRMED: r.newsletterConfirmed,
  newsletterConfirmed: r.newsletterConfirmed,
  ADVISOR: r.advisor,
  conselheiro: r.advisor,
  SITEMAP: '/sitemap.xml',
  RSS: '/rss.xml',
  CONTACT: r.contact,
  contato: r.contact,
} as const

export type RouteKey = keyof typeof ROUTES
