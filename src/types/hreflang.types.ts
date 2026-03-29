/**
 * src/types/hreflang.types.ts
 * Tipos para o sistema hreflang multi-domain (module-9-seo-sitemaps).
 *
 * INT-019, INT-020 — Hreflang cross-domain e x-default → EN.
 *
 * NOTA: O DOMAIN_MAP canônico está em `@config` (LOCALE_URLS).
 * Esta definição é o mapa de hreflang attribute codes (BCP-47)
 * que difere das chaves internas SupportedLocale ('it-IT' → 'it').
 */
import type { SupportedLocale } from '@config/types'

/**
 * Mapeamento de SupportedLocale (chave interna) → hreflang BCP-47 attribute code.
 * Consistente com layout.tsx (module-5/TASK-1).
 */
export const HREFLANG_CODE: Record<SupportedLocale, string> = {
  'pt-BR': 'pt-BR',
  'it-IT': 'it',
  'en': 'en',
  'es-ES': 'es',
}

/**
 * Locale padrão para x-default (versão global do site).
 * x-default → sempre aponta para https://systemforgesoftware.com
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en'

/**
 * Configuração hreflang para um artigo/post de blog.
 * Distingue conteúdo universal (traduzido) de exclusivo (apenas um locale).
 */
export interface ArticleHreflang {
  /** Slug canônico do artigo (identificador) */
  slug: string
  /**
   * Mapa de locale → slug localizado.
   * Apenas os locales presentes neste mapa recebem hreflang tags.
   *
   * @example // Artigo universal (3 locales)
   * { 'pt-BR': 'sobre-nos', 'it-IT': 'chi-siamo', 'en': 'about-us' }
   *
   * @example // Artigo exclusivo (apenas BR)
   * { 'pt-BR': 'carnaval-2025' }
   */
  localeSlugMap: Partial<Record<SupportedLocale, string>>
  /**
   * Se true: conteúdo exclusivo de um locale — sem hreflang alternates.
   * Se false: conteúdo universal com hreflang para todos os locales do mapa.
   */
  exclusive: boolean
}
