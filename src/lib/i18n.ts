/**
 * src/lib/i18n.ts
 * Funções de locale para a feature i18n-triple-market.
 *
 * FAIL-FAST: getSiteConfig() lança erro imediato se o locale for inválido.
 * Nenhum fallback silencioso em produção — erros de config aparecem em build time.
 *
 * Diferença em relação a config/index.ts:
 *   - Aceita argumento opcional de locale (precedência sobre env var)
 *   - Sem cache singleton (função pura — segura para builds paralelos)
 *   - Lança erro explícito para locale inválido em vez de fazer fallback silencioso
 */
import type { SiteConfig, SupportedLocale } from '@config/types'
import { brConfig } from '@config/sites/br'
import { itConfig } from '@config/sites/it'
import { enConfig } from '@config/sites/en'

const SITE_CONFIGS: Record<SupportedLocale, SiteConfig> = {
  'pt-BR': brConfig,
  'it-IT': itConfig,
  'en': enConfig,
}

const SUPPORTED_LOCALES = Object.keys(SITE_CONFIGS) as SupportedLocale[]

/**
 * Retorna true se o valor é um SupportedLocale válido.
 */
export function isLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as string[]).includes(value)
}

/**
 * Lê NEXT_PUBLIC_LOCALE do ambiente.
 * Em desenvolvimento sem a variável: retorna 'pt-BR' como fallback.
 * Em produção sem a variável: lança erro explícito.
 *
 * @throws Error se NODE_ENV=production e NEXT_PUBLIC_LOCALE não definido
 */
export function getActiveLocale(): SupportedLocale {
  const locale = process.env.NEXT_PUBLIC_LOCALE

  // String vazia equivale a ausente
  if (!locale) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[getActiveLocale] NEXT_PUBLIC_LOCALE não definido em produção')
    }
    return 'pt-BR' // dev fallback
  }

  if (!isLocale(locale)) {
    throw new Error(
      `[getActiveLocale] NEXT_PUBLIC_LOCALE inválido: "${locale}". ` +
      `Locales suportados: ${SUPPORTED_LOCALES.join(', ')}`
    )
  }

  return locale
}

/**
 * Retorna a SiteConfig para o locale informado ou para o locale ativo.
 *
 * FAIL-FAST: lança Error imediato se o locale não for suportado.
 * Sem fallback silencioso — erros de config aparecem em build time.
 *
 * @param locale Locale explícito (tem precedência sobre NEXT_PUBLIC_LOCALE)
 * @throws Error se o locale for inválido ou não suportado
 */
export function getSiteConfig(locale?: SupportedLocale): SiteConfig {
  const activeLocale = locale ?? getActiveLocale()
  const config = SITE_CONFIGS[activeLocale]

  if (!config) {
    throw new Error(
      `[getSiteConfig] Locale inválido: "${activeLocale}". ` +
      `Locales suportados: ${SUPPORTED_LOCALES.join(', ')}`
    )
  }

  return config
}
