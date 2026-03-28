/**
 * src/lib/analytics.ts
 * Helper para envio de eventos Google Analytics 4.
 *
 * INT-012 — Tracking de eventos GA4 por locale/domínio.
 * module-9-seo-sitemaps TASK-4/ST008
 *
 * Guarda silenciosamente se GA4 não estiver configurado ou em SSR.
 * Usar APENAS em Client Components (use client).
 */
import { getSiteConfig } from '@config'

/**
 * Envia um evento para o GA4 do domínio ativo.
 * NOP (no-operation) se:
 *   - Rodando no servidor (SSR/SSG)
 *   - `window.gtag` não está definido (script GA4 não carregado)
 *   - `ga4MeasurementId` não configurado no SiteConfig
 *
 * @param name   Nome do evento (ex: 'cta_click', 'form_submit')
 * @param params Parâmetros adicionais (ex: { label: 'whatsapp', value: 1 })
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return

  const config = getSiteConfig()
  if (!config.ga4MeasurementId) return

  if (typeof window.gtag !== 'function') return

  window.gtag('event', name, {
    send_to: config.ga4MeasurementId,
    ...params,
  })
}

/**
 * Envia evento de page_view manual.
 * Normalmente o GA4 dispara page_view automaticamente,
 * mas em SPA ou após navegação programática pode ser necessário.
 *
 * @param path Caminho da página (ex: '/servicos')
 */
export function trackPageView(path: string): void {
  trackEvent('page_view', { page_path: path })
}
