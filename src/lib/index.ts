/**
 * lib/index.ts
 * Barrel export de lib/.
 * Importações preferidas:
 *   import { ServiceCategory, PortfolioProject } from '@/lib/types'
 *   import { generatePageMetadata } from '@/lib/seo'
 *   import { ROUTES } from '@/lib/constants/routes'
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
