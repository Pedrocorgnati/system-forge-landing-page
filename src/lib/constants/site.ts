/**
 * lib/constants/site.ts
 * Configurações globais do site e navegação.
 */
import { ROUTES } from './routes'

export const SITE = {
  name: 'SystemForge',
  tagline: 'Software sob medida para transformar negócios',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://forjadesistemas.com.br',
  domain: 'forjadesistemas.com.br',
  author: 'SystemForge',
  email: 'contato@forjadesistemas.com.br',
  linkedin: 'https://www.linkedin.com/company/systemforge',
  instagram: 'https://www.instagram.com/systemforge',
  tiktok: 'https://www.tiktok.com/@systemforge',
} as const

export const NAV_LINKS = [
  { label: 'Início', href: ROUTES.HOME },
  { label: 'Serviços', href: ROUTES.SERVICES },
  { label: 'Portfólio', href: ROUTES.PORTFOLIO },
  { label: 'Blog', href: ROUTES.BLOG },
  { label: 'Contato', href: ROUTES.CONTACT },
] as const

export const BLOG_ITEMS_PER_PAGE = 12

/** Status dos projetos do portfólio — mapeados para os novos valores de ProjectStatus */
export const STATUS_CONFIG = {
  producao: {
    label: 'Em produção',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  'desenvolvimento-avancado': {
    label: 'Em desenvolvimento',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
} as const satisfies Record<string, { label: string; className: string }>
