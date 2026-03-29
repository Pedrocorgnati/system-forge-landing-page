/**
 * lib/constants/analytics.ts
 * Nomes de eventos GA4 usados no site.
 * Centraliza strings para evitar typos e facilitar auditoria.
 */

export const GA4_EVENTS = {
  /** Erro capturado pelo Error Boundary global */
  EXCEPTION: 'exception',
  /** Clique em qualquer CTAButton (whatsapp, calendly, etc.) */
  CTA_CLICKED: 'cta_clicked',
  /** Busca realizada no SearchBar do blog */
  SEARCH: 'search',
  /** Page view manual (SPA navigation) */
  PAGE_VIEW: 'page_view',
} as const

export type GA4EventName = typeof GA4_EVENTS[keyof typeof GA4_EVENTS]
