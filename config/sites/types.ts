/**
 * config/sites/types.ts
 * Tipos centrais do sistema i18n triple-market.
 * Re-exporta de config/types para single source of truth.
 * Módulos 2–14 importam de 'config/sites' ou '@config/sites'.
 */
export type {
  SupportedLocale,
  MarketCurrency,
  ComplianceFramework,
  SiteConfig,
  NavItem,
  LocaleRoutes,
  LocaleMessages,
} from '../types'
