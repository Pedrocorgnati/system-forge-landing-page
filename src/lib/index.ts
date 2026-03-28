/**
 * lib/index.ts
 * Barrel export de lib/.
 * Importações preferidas:
 *   import { ServiceCategory, PortfolioProject } from '@/lib/types'
 *   import { generatePageMetadata } from '@/lib/seo'
 *   import { ROUTES } from '@/lib/constants/routes'
 *   import { getSiteConfig, getActiveLocale } from '@/lib/i18n'
 *   import { ROUTE_SLUGS, SERVICE_SLUGS, getSlug } from '@/lib/locale-slugs'
 *
 * Nota: não re-exportar lib/env (singleton — importar diretamente)
 */
export * from './types'
export * from './schemas'
export * from './seo'
export * from './cta'
export * from './images'
export * from './constants/routes'
export * from './constants/messages'
export * from './constants/seo'
export { getSiteConfig, getActiveLocale, isLocale } from './i18n'
export {
  ROUTE_SLUGS,
  SERVICE_SLUGS,
  SERVICE_CATEGORY_SLUGS,
  getSlug,
} from './locale-slugs'
