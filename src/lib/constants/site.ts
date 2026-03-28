/**
 * lib/constants/site.ts
 * Configurações globais do site e navegação.
 * Delegam para getSiteConfig() — locale-aware desde i18n-triple-market.
 */
import { getSiteConfig } from '@config'

const config = getSiteConfig()

export const SITE = {
  name: config.siteName,
  tagline: config.tagline,
  url: config.url,
  domain: config.domain,
  author: config.author,
  email: config.email,
  whatsapp: config.whatsapp,
  calendly: config.calendly,
  budgetEngine: config.budgetEngine,
  linkedin: config.socialLinks.linkedin,
  github: config.socialLinks.github,
  instagram: config.socialLinks.instagram,
  tiktok: config.socialLinks.tiktok,
} as const

export const NAV_LINKS = config.navigation

export const BLOG_ITEMS_PER_PAGE = 12

/** Status dos projetos do portfólio */
export const STATUS_CONFIG = {
  completed: {
    label: 'Em produção',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  in_progress: {
    label: 'Em desenvolvimento',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  producao: {
    label: 'Em produção',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  'desenvolvimento-avancado': {
    label: 'Em desenvolvimento',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
} as const satisfies Record<string, { label: string; className: string }>
