/**
 * src/lib/services/newsletter.ts
 *
 * Serviço cliente para inscrição na newsletter via Cloudflare Worker.
 *
 * Arquitetura:
 *   Next.js (static export) → Cloudflare Worker → Resend API
 *
 * O Worker (cloudflare-worker/newsletter-proxy/) é o único que toca a
 * RESEND_API_KEY. Este arquivo só faz fetch para a URL do Worker.
 *
 * Para integrar:
 *   1. Deploy do Worker (cloudflare-worker/newsletter-proxy/README.md)
 *   2. Setar NEXT_PUBLIC_NEWSLETTER_API_URL no .env.local
 *   3. Setar RESEND_API_KEY e RESEND_AUDIENCE_ID no Worker via wrangler secret
 *
 * @see NEWSLETTER-INTEGRATION.md para guia completo de integração
 * @see cloudflare-worker/newsletter-proxy/README.md para o Worker
 */

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
  error?: string
}

// =====================================================================
// Constantes
// =====================================================================

const NEWSLETTER_API_URL = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL

const TIMEOUT_MS = 10_000

// =====================================================================
// Funções
// =====================================================================

/**
 * Envia inscrição para o Cloudflare Worker.
 *
 * O Worker valida o payload, aplica rate limiting, verifica honeypot,
 * gera token double opt-in e envia email de confirmação via Resend.
 *
 * @returns NewsletterSubscribeResult
 * @throws nunca — erros são capturados e retornados como { success: false, error }
 */
export async function subscribeNewsletter(
  payload: NewsletterSubscribePayload,
): Promise<NewsletterSubscribeResult> {
  if (!NEWSLETTER_API_URL) {
    return { success: false, error: 'NEWSLETTER_NOT_CONFIGURED' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(NEWSLETTER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const json = await response.json().catch(() => ({})) as { error?: string }
      return { success: false, error: json.error ?? `HTTP ${response.status}` }
    }

    return { success: true }
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
 * Retorna true se o Worker está configurado (env var presente).
 * Útil para desabilitar o formulário de newsletter no build.
 */
export function isNewsletterConfigured(): boolean {
  return Boolean(NEWSLETTER_API_URL)
}
