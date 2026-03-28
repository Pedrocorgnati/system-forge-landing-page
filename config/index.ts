/**
 * config/index.ts
 * Resolve a configuração do site com base no NEXT_PUBLIC_LOCALE.
 * Cada build (br, it, en) define seu locale via env var.
 */
import type { SiteConfig, SupportedLocale } from './types'
import { brConfig } from './sites/br'
import { itConfig } from './sites/it'
import { enConfig } from './sites/en'

export type { SiteConfig, SupportedLocale, NavItem, LocaleRoutes, LocaleMessages } from './types'

const SITE_CONFIGS: Record<SupportedLocale, SiteConfig> = {
  'pt-BR': brConfig,
  'it-IT': itConfig,
  'en': enConfig,
}

/**
 * Resolve o locale a partir de NEXT_PUBLIC_LOCALE.
 * Default: pt-BR (backwards compatible com o site mono-idioma).
 */
function resolveLocale(): SupportedLocale {
  const raw = process.env.NEXT_PUBLIC_LOCALE ?? 'pt-BR'
  if (raw in SITE_CONFIGS) return raw as SupportedLocale
  return 'pt-BR'
}

let _cachedConfig: SiteConfig | null = null

/**
 * Retorna a SiteConfig para o build atual.
 * Singleton — o locale é fixo por build.
 */
export function getSiteConfig(): SiteConfig {
  if (!_cachedConfig) {
    _cachedConfig = SITE_CONFIGS[resolveLocale()]
  }
  return _cachedConfig
}

/**
 * Retorna o locale do build atual.
 */
export function getLocale(): SupportedLocale {
  return getSiteConfig().locale
}

/**
 * URLs dos 3 domínios — usadas para hreflang e language banner.
 */
export const LOCALE_URLS: Record<SupportedLocale, string> = {
  'pt-BR': 'https://forjadesistemas.com.br',
  'it-IT': 'https://systemforge.it',
  'en': 'https://systemforgesoftware.com',
}

/**
 * Todos os locales suportados.
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'it-IT', 'en']
