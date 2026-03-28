/**
 * config/sites/index.ts
 * Barrel export de config/sites/.
 * Ponto de entrada único para tipos e configs por mercado.
 *
 * Uso: import { SiteConfig, brConfig, getSiteConfig } from 'config/sites'
 *      import { SiteConfig } from '@config/sites'
 */
export type {
  SupportedLocale,
  MarketCurrency,
  ComplianceFramework,
  SiteConfig,
  NavItem,
  LocaleRoutes,
  LocaleMessages,
} from './types'

export { brConfig } from './br'
export { itConfig } from './it'
export { enConfig } from './en'
