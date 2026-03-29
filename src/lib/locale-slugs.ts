/**
 * src/lib/locale-slugs.ts
 * Slugs nativos por idioma para rotas institucionais e categorias de serviço.
 *
 * Regras:
 *   - Todos os slugs são lowercase, sem espaços, com '/' inicial
 *   - ROUTE_SLUGS cobre 8 rotas institucionais × 4 locales
 *   - SERVICE_SLUGS cobre todas as chaves de ServiceCategory × 4 locales
 *     (tipado como Record<keyof typeof ServiceCategory, ...> — cobertura obrigatória)
 *   - SERVICE_CATEGORY_SLUGS: subconjunto das 4 categorias extras (aliases de SERVICE_SLUGS)
 *   - getSlug(): helper tipado com falha explícita para locale inválido
 */
import type { SupportedLocale } from '@config/types'
import { ServiceCategory } from './types'

// ---------------------------------------------------------------------------
// ROUTE_SLUGS — rotas institucionais
// ---------------------------------------------------------------------------

export const ROUTE_SLUGS: Record<
  SupportedLocale,
  {
    home: string
    services: string
    portfolio: string
    about: string
    contact: string
    blog: string
    advisor: string
    privacy: string
  }
> = {
  'pt-BR': {
    home: '/',
    services: '/servicos',
    portfolio: '/portfolio',
    about: '/sobre',
    contact: '/contato',
    blog: '/blog',
    advisor: '/conselheiro',
    privacy: '/privacidade',
  },
  'it-IT': {
    home: '/',
    services: '/servizi',
    portfolio: '/portfolio', // intencional: slug universal
    about: '/chi-siamo',
    contact: '/contatto',
    blog: '/blog', // intencional: slug universal
    advisor: '/consulente',
    privacy: '/privacy',
  },
  'en': {
    home: '/',
    services: '/services',
    portfolio: '/portfolio', // intencional: slug universal
    about: '/about',
    contact: '/contact',
    blog: '/blog', // intencional: slug universal
    advisor: '/advisor',
    privacy: '/privacy',
  },
  'es-ES': {
    home: '/',
    services: '/servicios',
    portfolio: '/portfolio', // intencional: slug universal
    about: '/sobre',
    contact: '/contacto',
    blog: '/blog', // intencional: slug universal
    advisor: '/asesor',
    privacy: '/privacidad',
  },
}

export type RouteKey = keyof (typeof ROUTE_SLUGS)['pt-BR']

// ---------------------------------------------------------------------------
// SERVICE_SLUGS — todas as chaves de ServiceCategory × 4 locales
// Record<keyof typeof ServiceCategory, ...> garante cobertura total em build time
// ---------------------------------------------------------------------------

export const SERVICE_SLUGS: Record<
  keyof typeof ServiceCategory,
  Record<SupportedLocale, string>
> = {
  SAAS: {
    'pt-BR': '/servicos/saas',
    'it-IT': '/servizi/saas',
    'en': '/services/saas',
    'es-ES': '/servicios/saas',
  },
  MOBILE: {
    'pt-BR': '/servicos/mobile',
    'it-IT': '/servizi/mobile',
    'en': '/services/mobile',
    'es-ES': '/servicios/mobile',
  },
  MARKETPLACE: {
    'pt-BR': '/servicos/marketplace',
    'it-IT': '/servizi/marketplace',
    'en': '/services/marketplace',
    'es-ES': '/servicios/marketplace',
  },
  AI: {
    'pt-BR': '/servicos/automacao-ia',
    'it-IT': '/servizi/automazione-ia',
    'en': '/services/ai-automation',
    'es-ES': '/servicios/automatizacion-ia',
  },
  BOTS: {
    'pt-BR': '/servicos/bots',
    'it-IT': '/servizi/bot',
    'en': '/services/bots',
    'es-ES': '/servicios/bots',
  },
  CHATBOT: {
    // alias de BOTS — mesmo slug
    'pt-BR': '/servicos/bots',
    'it-IT': '/servizi/bot',
    'en': '/services/bots',
    'es-ES': '/servicios/bots',
  },
  LANDING: {
    // alias de LANDING_PAGE — mesmo slug
    'pt-BR': '/servicos/landing-page',
    'it-IT': '/servizi/landing-page',
    'en': '/services/landing-page',
    'es-ES': '/servicios/landing-page',
  },
  LANDING_PAGE: {
    'pt-BR': '/servicos/landing-page',
    'it-IT': '/servizi/landing-page',
    'en': '/services/landing-page',
    'es-ES': '/servicios/landing-page',
  },
  ECOMMERCE: {
    'pt-BR': '/servicos/ecommerce',
    'it-IT': '/servizi/ecommerce',
    'en': '/services/ecommerce',
    'es-ES': '/servicios/ecommerce',
  },
  DASHBOARD: {
    'pt-BR': '/servicos/dashboard',
    'it-IT': '/servizi/dashboard',
    'en': '/services/dashboard',
    'es-ES': '/servicios/dashboard',
  },
  API: {
    'pt-BR': '/servicos/api',
    'it-IT': '/servizi/api',
    'en': '/services/api',
    'es-ES': '/servicios/api',
  },
  DESKTOP: {
    'pt-BR': '/servicos/desktop',
    'it-IT': '/servizi/desktop',
    'en': '/services/desktop',
    'es-ES': '/servicios/desktop',
  },
  GESTAO: {
    'pt-BR': '/servicos/gestao',
    'it-IT': '/servizi/gestione',
    'en': '/services/management',
    'es-ES': '/servicios/gestion',
  },
  ERP: {
    'pt-BR': '/servicos/erp',
    'it-IT': '/servizi/erp',
    'en': '/services/erp',
    'es-ES': '/servicios/erp',
  },
  CONSULTORIA: {
    'pt-BR': '/servicos/consultoria',
    'it-IT': '/servizi/consulenza',
    'en': '/services/consulting',
    'es-ES': '/servicios/consultoria',
  },
}

// ---------------------------------------------------------------------------
// SERVICE_CATEGORY_SLUGS — subconjunto das 4 categorias extras
// Reusa SERVICE_SLUGS diretamente para evitar divergência (DRY)
// ---------------------------------------------------------------------------

export const SERVICE_CATEGORY_SLUGS: Pick<
  typeof SERVICE_SLUGS,
  'BOTS' | 'LANDING_PAGE' | 'DESKTOP' | 'GESTAO'
> = {
  BOTS: SERVICE_SLUGS.BOTS,
  LANDING_PAGE: SERVICE_SLUGS.LANDING_PAGE,
  DESKTOP: SERVICE_SLUGS.DESKTOP,
  GESTAO: SERVICE_SLUGS.GESTAO,
}

// ---------------------------------------------------------------------------
// getSlug — helper tipado
// ---------------------------------------------------------------------------

/**
 * Retorna o slug para uma rota institucional no locale informado.
 * Primeiro argumento tipado como RouteKey — erro de compilação para rota inválida.
 *
 * @throws Error se o locale for inválido em runtime
 */
export function getSlug(route: RouteKey, locale: SupportedLocale): string {
  const localeRoutes = ROUTE_SLUGS[locale]
  if (!localeRoutes) {
    throw new Error(
      `[getSlug] Locale inválido: "${locale}". ` +
      `Locales suportados: ${Object.keys(ROUTE_SLUGS).join(', ')}`
    )
  }
  return localeRoutes[route]
}
