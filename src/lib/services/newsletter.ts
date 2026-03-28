/**
 * src/lib/services/newsletter.ts
 *
 * Serviço cliente para inscrição na newsletter via Cloudflare Worker.
 *
 * Arquitetura:
 *   Next.js (static export) → Cloudflare Worker (BR|IT|EN) → Resend API
 *
 * Worker URL é resolvida via getSiteConfig().newsletter.workerUrl — o Worker
 * correto é selecionado automaticamente pelo build (NEXT_PUBLIC_LOCALE).
 *
 * Workers:
 *   BR: NEXT_PUBLIC_NEWSLETTER_WORKER_URL_BR  (LGPD, single opt-in)
 *   IT: NEXT_PUBLIC_NEWSLETTER_WORKER_URL_IT  (GDPR, double opt-in — retorna 202)
 *   EN: NEXT_PUBLIC_NEWSLETTER_WORKER_URL_EN  (CAN-SPAM, single opt-in)
 *
 * @see docs/email-dns-setup.md para configuração DNS/SPF/DKIM
 * @see workers/worker-{br,it,en}/README.md para setup dos Workers
 */

import { getSiteConfig } from '@config'

// =====================================================================
// Tipos
// =====================================================================

export interface NewsletterSubscribePayload {
  email: string
  consent: boolean
  /** Campo honeypot — deve estar vazio; preenchido indica bot */
  website?: string
}

export interface NewsletterSubscribeResult {
  success: boolean
  /** HTTP status da resposta do Worker (201 = subscribed, 202 = pending GDPR) */
  status?: number
  error?: string
}

// =====================================================================
// Constantes
// =====================================================================

const TIMEOUT_MS = 10_000

// =====================================================================
// Funções
// =====================================================================

/**
 * Envia inscrição para o Cloudflare Worker do locale atual.
 *
 * Retorna { success: true, status: 201 } para BR/EN (inscrito imediatamente).
 * Retorna { success: true, status: 202 } para IT (GDPR pending — aguarda confirmação por email).
 *
 * @returns NewsletterSubscribeResult
 * @throws nunca — erros são capturados e retornados como { success: false, error }
 */
export async function subscribeNewsletter(
  payload: NewsletterSubscribePayload,
): Promise<NewsletterSubscribeResult> {
  const config = getSiteConfig()
  const workerUrl = config.newsletter?.workerUrl

  if (!workerUrl) {
    return { success: false, error: 'NEWSLETTER_NOT_CONFIGURED' }
  }

  const subscribeUrl = workerUrl.endsWith('/subscribe')
    ? workerUrl
    : `${workerUrl.replace(/\/$/, '')}/subscribe`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const json = await response.json().catch(() => ({})) as { error?: string; status?: string }
      return { success: false, error: json.error ?? `HTTP ${response.status}`, status: response.status }
    }

    return { success: true, status: response.status }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'TIMEOUT' }
    }
    return { success: false, error: 'NETWORK_ERROR' }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Retorna true se o Worker está configurado (workerUrl presente no SiteConfig).
 */
export function isNewsletterConfigured(): boolean {
  const config = getSiteConfig()
  return Boolean(config.newsletter?.workerUrl)
}
