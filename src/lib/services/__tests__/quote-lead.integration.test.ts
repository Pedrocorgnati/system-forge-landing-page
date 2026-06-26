/**
 * src/lib/services/__tests__/quote-lead.integration.test.ts
 *
 * Testes de INTEGRAÇÃO do serviço de leads de orçamento (quote-lead).
 * Exercita submitQuoteLead() com fetch mockado (sem rede real).
 *
 * Arquitetura testada:
 *   submitQuoteLead() → fetch → quote-worker-{br,it,en,es} (POST /lead)
 *   (Worker mockado via vi.stubGlobal — MSW não é dependência do projeto)
 *
 * Cobertura (Aceite Item 015 — todos sem deadend):
 *   201/202 — sucesso (pending / already-received → success:true)
 *   400 — INVALID_* / CONSENT_REQUIRED (4xx mapeado por code)
 *   429 — rate limit (Item 006)
 *   403 — Turnstile reprovado (Item 006)
 *   5xx — CONFIG_ERROR / indisponibilidade
 *   TIMEOUT — AbortController (timeout 10s)
 *   NETWORK_ERROR — fetch rejeita
 *   Não configurado — workerUrl ausente, sem chamar fetch
 *   Single-flight — submits concorrentes coalescem em UMA chamada
 *   Construção de URL — /lead adicionado automaticamente
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// -------------------------------------------------------------------------
// Mock do @config — isolado do ambiente de build (env vars em import-time)
// -------------------------------------------------------------------------
const mockWorkerUrl = 'https://quote-worker-br.test'

vi.mock('@config', () => ({
  getSiteConfig: vi.fn(() => ({
    locale: 'pt-BR',
    quoteLead: { workerUrl: mockWorkerUrl },
  })),
}))

import { submitQuoteLead, isQuoteLeadConfigured } from '../quote-lead'
import { getSiteConfig } from '@config'

const mockGetSiteConfig = vi.mocked(getSiteConfig)

function mockResponse(status: number, body: object = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Payload válido — serviceId CRU + consent + locale + turnstileToken.
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    serviceId: 'landing-page',
    description: 'Preciso de uma landing page com formulario de orcamento.',
    budgetRange: '5k-15k',
    timeline: '1-3months',
    name: 'Pedro Corgnati',
    email: 'pedro@systemforge.com',
    whatsapp: '+55 11 99999-0000',
    consent: true,
    locale: 'pt-BR',
    turnstileToken: 'tok-abc',
    ...overrides,
  }
}

describe('submitQuoteLead — integração (Worker mockado)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    mockGetSiteConfig.mockReturnValue({
      locale: 'pt-BR',
      quoteLead: { workerUrl: mockWorkerUrl },
    } as unknown as ReturnType<typeof getSiteConfig>)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Sucesso (201/202)
  // -----------------------------------------------------------------------
  describe('Sucesso', () => {
    it('202 pending: retorna { success: true, status: 202 }', async () => {
      fetchSpy.mockResolvedValue(mockResponse(202, { success: true, status: 'pending' }))
      const result = await submitQuoteLead(validPayload())
      expect(result).toEqual({ success: true, status: 202 })
    })

    it('201 created: retorna { success: true, status: 201 }', async () => {
      fetchSpy.mockResolvedValue(mockResponse(201, { success: true }))
      const result = await submitQuoteLead(validPayload())
      expect(result).toEqual({ success: true, status: 201 })
    })

    it('200 already-received: retorna { success: true, status: 200 }', async () => {
      fetchSpy.mockResolvedValue(mockResponse(200, { success: true, status: 'already-received' }))
      const result = await submitQuoteLead(validPayload())
      expect(result).toEqual({ success: true, status: 200 })
    })

    it('faz POST {workerUrl}/lead com serviceId, consent, turnstileToken e locale', async () => {
      fetchSpy.mockResolvedValue(mockResponse(202))
      await submitQuoteLead(validPayload())

      expect(fetchSpy).toHaveBeenCalledOnce()
      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe(`${mockWorkerUrl}/lead`)
      expect(options.method).toBe('POST')
      expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' })
      const sent = JSON.parse(options.body as string)
      expect(sent.serviceId).toBe('landing-page')
      expect(sent.consent).toBe(true)
      expect(sent.turnstileToken).toBe('tok-abc')
      expect(sent.locale).toBe('pt-BR')
    })
  })

  // -----------------------------------------------------------------------
  // Erros do Worker (4xx/5xx) — mapeados por code, nunca lançam
  // -----------------------------------------------------------------------
  describe('Erros do Worker', () => {
    it('400 CONSENT_REQUIRED: success:false, error=code, status=400', async () => {
      fetchSpy.mockResolvedValue(mockResponse(400, { error: 'Consentimento obrigatorio.', code: 'CONSENT_REQUIRED' }))
      const result = await submitQuoteLead(validPayload({ consent: false }))
      expect(result).toEqual({ success: false, error: 'CONSENT_REQUIRED', status: 400 })
    })

    it('403 Turnstile reprovado: success:false, status=403', async () => {
      fetchSpy.mockResolvedValue(mockResponse(403, { error: 'Verificacao falhou.', code: 'TURNSTILE_FAILED' }))
      const result = await submitQuoteLead(validPayload())
      expect(result.success).toBe(false)
      expect(result.status).toBe(403)
      expect(result.error).toBe('TURNSTILE_FAILED')
    })

    it('429 rate limit: success:false, status=429', async () => {
      fetchSpy.mockResolvedValue(mockResponse(429, { error: 'Muitas tentativas.', code: 'RATE_LIMITED' }))
      const result = await submitQuoteLead(validPayload())
      expect(result.success).toBe(false)
      expect(result.status).toBe(429)
      expect(result.error).toBe('RATE_LIMITED')
    })

    it('500 CONFIG_ERROR: success:false, status=500', async () => {
      fetchSpy.mockResolvedValue(mockResponse(500, { error: 'Erro de configuracao.', code: 'CONFIG_ERROR' }))
      const result = await submitQuoteLead(validPayload())
      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.error).toBe('CONFIG_ERROR')
    })

    it('resposta sem body JSON: usa "HTTP {status}" como fallback', async () => {
      fetchSpy.mockResolvedValue(new Response('Bad Gateway', { status: 502 }))
      const result = await submitQuoteLead(validPayload())
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/HTTP 502/)
    })
  })

  // -----------------------------------------------------------------------
  // Falhas de rede
  // -----------------------------------------------------------------------
  describe('Falhas de rede', () => {
    it('NETWORK_ERROR — fetch rejeita', async () => {
      fetchSpy.mockRejectedValue(new Error('Connection refused'))
      const result = await submitQuoteLead(validPayload())
      expect(result).toEqual({ success: false, error: 'NETWORK_ERROR' })
    })

    it('TIMEOUT — AbortError', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetchSpy.mockRejectedValue(abortError)
      const result = await submitQuoteLead(validPayload())
      expect(result).toEqual({ success: false, error: 'TIMEOUT' })
    })

    it('nunca lança — sempre retorna objeto de resultado', async () => {
      fetchSpy.mockRejectedValue(new TypeError('Unexpected'))
      await expect(submitQuoteLead(validPayload())).resolves.toMatchObject({ success: false })
    })
  })

  // -----------------------------------------------------------------------
  // Não configurado
  // -----------------------------------------------------------------------
  describe('Não configurado', () => {
    it('workerUrl vazio: QUOTE_WORKER_NOT_CONFIGURED sem chamar fetch', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        quoteLead: { workerUrl: '' },
      } as unknown as ReturnType<typeof getSiteConfig>)
      const result = await submitQuoteLead(validPayload())
      expect(result).toEqual({ success: false, error: 'QUOTE_WORKER_NOT_CONFIGURED' })
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('quoteLead undefined: success:false sem chamar fetch', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        quoteLead: undefined,
      } as unknown as ReturnType<typeof getSiteConfig>)
      const result = await submitQuoteLead(validPayload())
      expect(result.success).toBe(false)
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // Single-flight: submits concorrentes coalescem
  // -----------------------------------------------------------------------
  describe('Single-flight', () => {
    it('chamadas concorrentes com a mesma chave compartilham UMA requisição', async () => {
      let resolveFetch!: (r: Response) => void
      fetchSpy.mockReturnValue(new Promise<Response>((res) => { resolveFetch = res }))

      const p1 = submitQuoteLead(validPayload())
      const p2 = submitQuoteLead(validPayload())
      resolveFetch(mockResponse(202))

      const [r1, r2] = await Promise.all([p1, p2])
      expect(fetchSpy).toHaveBeenCalledOnce()
      expect(r1).toEqual({ success: true, status: 202 })
      expect(r2).toEqual({ success: true, status: 202 })
    })

    it('apos resolver, nova chamada dispara nova requisição', async () => {
      fetchSpy.mockResolvedValue(mockResponse(202))
      await submitQuoteLead(validPayload())
      await submitQuoteLead(validPayload())
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  // -----------------------------------------------------------------------
  // Construção de URL
  // -----------------------------------------------------------------------
  describe('Construção de URL', () => {
    it('adiciona /lead quando workerUrl não termina com /lead', async () => {
      fetchSpy.mockResolvedValue(mockResponse(202))
      await submitQuoteLead(validPayload())
      const [url] = fetchSpy.mock.calls[0] as [string]
      expect(url).toBe('https://quote-worker-br.test/lead')
    })

    it('não duplica /lead', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        quoteLead: { workerUrl: 'https://quote-worker-br.test/lead' },
      } as unknown as ReturnType<typeof getSiteConfig>)
      fetchSpy.mockResolvedValue(mockResponse(202))
      await submitQuoteLead(validPayload())
      const [url] = fetchSpy.mock.calls[0] as [string]
      expect(url).toBe('https://quote-worker-br.test/lead')
    })

    it('remove barra final antes de adicionar /lead', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        quoteLead: { workerUrl: 'https://quote-worker-br.test/' },
      } as unknown as ReturnType<typeof getSiteConfig>)
      fetchSpy.mockResolvedValue(mockResponse(202))
      await submitQuoteLead(validPayload())
      const [url] = fetchSpy.mock.calls[0] as [string]
      expect(url).toBe('https://quote-worker-br.test/lead')
    })
  })
})

describe('isQuoteLeadConfigured', () => {
  afterEach(() => vi.clearAllMocks())

  it('true quando workerUrl configurado', () => {
    vi.mocked(getSiteConfig).mockReturnValue({
      quoteLead: { workerUrl: 'https://q.test' },
    } as unknown as ReturnType<typeof getSiteConfig>)
    expect(isQuoteLeadConfigured()).toBe(true)
  })

  it('false quando workerUrl vazio', () => {
    vi.mocked(getSiteConfig).mockReturnValue({
      quoteLead: { workerUrl: '' },
    } as unknown as ReturnType<typeof getSiteConfig>)
    expect(isQuoteLeadConfigured()).toBe(false)
  })
})
