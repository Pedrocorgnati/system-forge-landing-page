/**
 * lib/constants/seo.ts
 * Configurações padrão de SEO.
 * Delegam para getSiteConfig() — locale-aware desde i18n-triple-market.
 */
import { getSiteConfig } from '@config'

const config = getSiteConfig()

export const SEO_DEFAULTS = {
  titleTemplate: config.seo.titleTemplate,
  homeTitle: config.seo.title,
  defaultDescription: config.seo.description,
  defaultOgImage: config.seo.ogImage,
  siteName: config.siteName,
  locale: config.ogLocale,
  twitterCard: 'summary_large_image' as const,
  twitterHandle: undefined as string | undefined,
  defaultRobots: 'index,follow',
  noIndexRobots: 'noindex,nofollow',
} as const
