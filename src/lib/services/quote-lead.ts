/**
 * src/lib/services/quote-lead.ts
 *
 * Serviço cliente para envio de leads de orçamento via Cloudflare Worker.
 * Espelha src/lib/services/newsletter.ts: timeout 10s + AbortController, mapa de
 * erro que NUNCA lança (sempre retorna um QuoteLeadResult), e single-flight para
 * coalescer submits duplicados (double-click / re-render).
 *
 * Arquitetura:
 *   Next.js (static export) → Cloudflare Worker (quote-worker-{br,it,en,es})
 *     → ingest server-to-server (systemforge-dashboard) → D1
 *
 * Worker URL é resolvida via getSiteConfig().quoteLead.workerUrl — o Worker
 * correto é selecionado automaticamente pelo build (NEXT_PUBLIC_LOCALE):
 *   BR: NEXT_PUBLIC_QUOTE_WORKER_URL_BR
 *   IT: NEXT_PUBLIC_QUOTE_WORKER_URL_IT
 *   EN: NEXT_PUBLIC_QUOTE_WORKER_URL_EN
 *   ES: NEXT_PUBLIC_QUOTE_WORKER_URL_ES
 *
 * Contrato do endpoint (POST {workerUrl}/lead — quote-worker types.ts):
 *   sucesso: 200 (already-received) | 202 (pending) — qualquer 2xx é sucesso.
 *   erro: 400 (INVALID_*, CONSENT_REQUIRED), 403 (Turnstile), 429 (rate limit),
 *         5xx (CONFIG_ERROR / indisponibilidade). Nenhum 4xx/5xx vira deadend:
 *         o caller (QuoteWizard) entra em modo degradado e ainda registra o lead.
 *
 * @see workers/quote-worker-br/src/index.ts (rota POST /lead)
 * @see src/lib/services/newsletter.ts (serviço-espelho)
 */

import { getSiteConfig } from '@config'

// =====================================================================
// Tipos
// =====================================================================

/**
 * Payload enviado ao Worker. Espelha LeadRequest de quote-worker types.ts.
 * Atenção: o Worker recebe o `serviceId` CRU (um dos 9 ids do wizard) e deriva
 * o projectType server-side — por isso enviamos serviceId, não projectType.
 */
export interface QuoteLeadPayload {
  serviceId: string
  description: string
  budgetRange: string
  timeline: string
  name: string
  email: string
  whatsapp: string
  consent: boolean
  locale: string
  turnstileToken?: string
  referralSource?: string
  brand?: string
  /** Campo honeypot — deve estar vazio; preenchido indica bot (Worker rejeita). */
  website?: string
}

export interface QuoteLeadResult {
  success: boolean
  /** HTTP status da resposta do Worker (200 already-received | 202 pending). */
  status?: number
  /** Code/erro do Worker (body.code) ou sentinela local (TIMEOUT, NETWORK_ERROR). */
  error?: string
}

// =====================================================================
// Constantes
// =====================================================================

const TIMEOUT_MS = 10_000

// Single-flight: coalesce submits concorrentes com a MESMA chave (mesma
// semântica do lead_hash do Worker: serviceId+email+budgetRange+timeline).
// Evita 429/duplicidade quando o usuário clica duas vezes ou o componente
// re-renderiza durante o await.
const inFlight = new Map<string, Promise<QuoteLeadResult>>()

function flightKey(payload: QuoteLeadPayload): string {
  return [
    payload.serviceId,
    payload.email.trim().toLowerCase(),
    payload.budgetRange,
    payload.timeline,
  ].join('|')
}

// =====================================================================
// Funções
// =====================================================================

/**
 * Envia o lead de orçamento ao Cloudflare Worker do locale atual.
 *
 * NUNCA lança: qualquer falha (HTTP 4xx/5xx, timeout, rede) volta como
 * { success: false, error }. Single-flight: chamadas concorrentes com a mesma
 * chave compartilham a MESMA Promise.
 *
 * @returns QuoteLeadResult
 */
export async function submitQuoteLead(
  payload: QuoteLeadPayload,
): Promise<QuoteLeadResult> {
  const key = flightKey(payload)
  const existing = inFlight.get(key)
  if (existing) return existing

  const promise = doSubmit(payload).finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, promise)
  return promise
}

async function doSubmit(payload: QuoteLeadPayload): Promise<QuoteLeadResult> {
  const config = getSiteConfig()
  const workerUrl = config.quoteLead?.workerUrl

  if (!workerUrl) {
    return { success: false, error: 'QUOTE_WORKER_NOT_CONFIGURED' }
  }

  const leadUrl = workerUrl.endsWith('/lead')
    ? workerUrl
    : `${workerUrl.replace(/\/$/, '')}/lead`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(leadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as {
        code?: string
        error?: string
      }
      return {
        success: false,
        error: json.code ?? json.error ?? `HTTP ${response.status}`,
        status: response.status,
      }
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
 * Retorna true se o Quote Worker está configurado (workerUrl presente).
 */
export function isQuoteLeadConfigured(): boolean {
  const config = getSiteConfig()
  return Boolean(config.quoteLead?.workerUrl)
}
