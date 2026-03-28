/**
 * src/lib/services/__tests__/newsletter.integration.test.ts
 *
 * Testes de INTEGRAÇÃO do serviço de newsletter.
 * Exercita subscribeNewsletter() com fetch mockado (sem rede real).
 *
 * Arquitetura testada:
 *   subscribeNewsletter() → fetch → Cloudflare Worker → Resend API
 *   (Worker mockado via vi.stubGlobal — MSW não é dependência do projeto)
 *
 * Cobertura:
 *   Cenário 1 — Happy path BR/EN: Worker retorna 201 (inscrito imediatamente)
 *   Cenário 2 — Happy path IT: Worker retorna 202 (GDPR double opt-in pendente)
 *   Cenário 3 — Erros do Worker: NEWS_001, NEWS_003, NEWS_005 (4xx mapeados)
 *   Cenário 4 — Falhas de rede: timeout (AbortController), NETWORK_ERROR
 *   Cenário 5 — Segurança: honeypot preenchido, workerUrl ausente
 *   Cenário 6 — Construção de URL: endpoint /subscribe adicionado automaticamente
 *
 * Referência ERROR-CATALOG:
 *   NEWS_001 — Email inválido no formulário (400 do Worker)
 *   NEWS_002 — Resend API indisponível (502/503 do Worker)
 *   NEWS_003 — Email já inscrito (409 do Worker)
 *   NEWS_004 — Token confirmação expirado / GDPR (202 — não é erro)
 *   NEWS_005 — Rate limit excedido (429 do Worker)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// -------------------------------------------------------------------------
// Mock do @config — isolado do ambiente de build (env vars em import-time)
// -------------------------------------------------------------------------
const mockWorkerUrl = 'https://worker-br.test'

vi.mock('@config', () => ({
  getSiteConfig: vi.fn(() => ({
    locale: 'pt-BR',
    newsletter: {
      workerUrl: mockWorkerUrl,
      doubleOptIn: false,
    },
  })),
}))

// Import após mocks configurados
import { subscribeNewsletter, isNewsletterConfigured } from '../newsletter'
import { getSiteConfig } from '@config'

const mockGetSiteConfig = vi.mocked(getSiteConfig)

// -------------------------------------------------------------------------
// Helper: cria uma Response mockada
// -------------------------------------------------------------------------
function mockResponse(status: number, body: object = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// -------------------------------------------------------------------------
// Helper: payload válido de inscrição
// -------------------------------------------------------------------------
const validPayload = {
  email: 'pedro@systemforge.com',
  consent: true,
}

describe('subscribeNewsletter — integração (Worker mockado)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    // Resetar para config padrão BR antes de cada teste
    mockGetSiteConfig.mockReturnValue({
      locale: 'pt-BR',
      newsletter: { workerUrl: mockWorkerUrl, doubleOptIn: false },
    } as ReturnType<typeof getSiteConfig>)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // Cenário 1: Happy path BR/EN — 201 Subscribed
  // -------------------------------------------------------------------------
  describe('Cenário 1: Happy path — inscrição imediata (201)', () => {
    it('retorna { success: true, status: 201 } quando Worker confirma inscrição', async () => {
      fetchSpy.mockResolvedValue(mockResponse(201))

      const result = await subscribeNewsletter(validPayload)

      expect(result).toEqual({ success: true, status: 201 })
    })

    it('faz POST para {workerUrl}/subscribe com Content-Type application/json', async () => {
      fetchSpy.mockResolvedValue(mockResponse(201))

      await subscribeNewsletter(validPayload)

      expect(fetchSpy).toHaveBeenCalledOnce()
      const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe(`${mockWorkerUrl}/subscribe`)
      expect(options.method).toBe('POST')
      expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' })
    })

    it('envia o payload serializado no body da requisição', async () => {
      fetchSpy.mockResolvedValue(mockResponse(201))

      await subscribeNewsletter(validPayload)

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const sentBody = JSON.parse(options.body as string)
      expect(sentBody.email).toBe(validPayload.email)
      expect(sentBody.consent).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Cenário 2: Happy path IT — 202 GDPR pending
  // Mapeia para ERROR-CATALOG: NEWS_004 (token confirmação — fluxo esperado)
  // -------------------------------------------------------------------------
  describe('Cenário 2: Happy path IT — GDPR double opt-in (202)', () => {
    it('retorna { success: true, status: 202 } para Worker IT (GDPR pendente)', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'it-IT',
        newsletter: {
          workerUrl: 'https://worker-it.test',
          doubleOptIn: true,
        },
      } as ReturnType<typeof getSiteConfig>)

      fetchSpy.mockResolvedValue(mockResponse(202))

      const result = await subscribeNewsletter(validPayload)

      expect(result).toEqual({ success: true, status: 202 })
    })
  })

  // -------------------------------------------------------------------------
  // Cenário 3: Erros do Worker (4xx)
  // -------------------------------------------------------------------------
  describe('Cenário 3: Erros retornados pelo Worker', () => {
    it('NEWS_001 — 400 email inválido: retorna { success: false, error: "NEWS_001" }', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse(400, { error: 'NEWS_001', message: 'Email inválido' })
      )

      const result = await subscribeNewsletter({ email: 'invalido', consent: true })

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.error).toBe('NEWS_001')
    })

    it('NEWS_003 — 409 email já inscrito: retorna { success: false, status: 409 }', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse(409, { error: 'NEWS_003', message: 'Email já inscrito' })
      )

      const result = await subscribeNewsletter(validPayload)

      expect(result.success).toBe(false)
      expect(result.status).toBe(409)
      expect(result.error).toBe('NEWS_003')
    })

    it('NEWS_005 — 429 rate limit: retorna { success: false, status: 429 }', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse(429, { error: 'NEWS_005', message: 'Rate limit excedido' })
      )

      const result = await subscribeNewsletter(validPayload)

      expect(result.success).toBe(false)
      expect(result.status).toBe(429)
      expect(result.error).toBe('NEWS_005')
    })

    it('NEWS_002 — 503 Resend indisponível: retorna { success: false, status: 503 }', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse(503, { error: 'NEWS_002' })
      )

      const result = await subscribeNewsletter(validPayload)

      expect(result.success).toBe(false)
      expect(result.status).toBe(503)
    })

    it('resposta sem body de erro: usa "HTTP {status}" como mensagem fallback', async () => {
      // Worker retorna 500 com body não-JSON
      fetchSpy.mockResolvedValue(
        new Response('Internal Server Error', { status: 500 })
      )

      const result = await subscribeNewsletter(validPayload)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/HTTP 500/)
    })
  })

  // -------------------------------------------------------------------------
  // Cenário 4: Falhas de rede
  // -------------------------------------------------------------------------
  describe('Cenário 4: Falhas de rede', () => {
    it('NETWORK_ERROR — fetch rejeita: retorna { success: false, error: "NETWORK_ERROR" }', async () => {
      fetchSpy.mockRejectedValue(new Error('Connection refused'))

      const result = await subscribeNewsletter(validPayload)

      expect(result).toEqual({ success: false, error: 'NETWORK_ERROR' })
    })

    it('TIMEOUT — AbortError: retorna { success: false, error: "TIMEOUT" }', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      fetchSpy.mockRejectedValue(abortError)

      const result = await subscribeNewsletter(validPayload)

      expect(result).toEqual({ success: false, error: 'TIMEOUT' })
    })

    it('nunca lança exceção — sempre retorna objeto de resultado', async () => {
      fetchSpy.mockRejectedValue(new TypeError('Unexpected network error'))

      await expect(subscribeNewsletter(validPayload)).resolves.toMatchObject({
        success: false,
      })
    })
  })

  // -------------------------------------------------------------------------
  // Cenário 5: Segurança
  // Referência THREAT-MODEL: THREAT-003 (abuso API newsletter / bot)
  // -------------------------------------------------------------------------
  describe('Cenário 5: Segurança', () => {
    it('workerUrl ausente (NEWSLETTER_NOT_CONFIGURED): retorna { success: false } sem chamar fetch', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        newsletter: { workerUrl: '', doubleOptIn: false },
      } as ReturnType<typeof getSiteConfig>)

      const result = await subscribeNewsletter(validPayload)

      expect(result).toEqual({ success: false, error: 'NEWSLETTER_NOT_CONFIGURED' })
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('newsletter.workerUrl undefined: retorna { success: false } sem chamar fetch', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        newsletter: undefined,
      } as unknown as ReturnType<typeof getSiteConfig>)

      const result = await subscribeNewsletter(validPayload)

      expect(result.success).toBe(false)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('campo honeypot preenchido é incluído no payload — Worker decide rejeição', async () => {
      // O serviço não filtra honeypot — responsabilidade do Worker.
      // Este teste garante que o campo website é transmitido quando presente.
      fetchSpy.mockResolvedValue(mockResponse(400, { error: 'BOT_DETECTED' }))

      const payloadComHoneypot = { ...validPayload, website: 'https://spam.com' }
      const result = await subscribeNewsletter(payloadComHoneypot)

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const sentBody = JSON.parse(options.body as string)
      expect(sentBody.website).toBe('https://spam.com')
      expect(result.success).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Cenário 6: Construção de URL
  // -------------------------------------------------------------------------
  describe('Cenário 6: Construção de URL do endpoint', () => {
    it('adiciona /subscribe se workerUrl não terminar com /subscribe', async () => {
      fetchSpy.mockResolvedValue(mockResponse(201))

      await subscribeNewsletter(validPayload)

      const [url] = fetchSpy.mock.calls[0] as [string]
      expect(url).toBe('https://worker-br.test/subscribe')
    })

    it('não duplica /subscribe se workerUrl já terminar com /subscribe', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        newsletter: {
          workerUrl: 'https://worker-br.test/subscribe',
          doubleOptIn: false,
        },
      } as ReturnType<typeof getSiteConfig>)

      fetchSpy.mockResolvedValue(mockResponse(201))

      await subscribeNewsletter(validPayload)

      const [url] = fetchSpy.mock.calls[0] as [string]
      expect(url).toBe('https://worker-br.test/subscribe')
      expect(url).not.toBe('https://worker-br.test/subscribe/subscribe')
    })

    it('remove barra final do workerUrl antes de adicionar /subscribe', async () => {
      mockGetSiteConfig.mockReturnValue({
        locale: 'pt-BR',
        newsletter: {
          workerUrl: 'https://worker-br.test/',
          doubleOptIn: false,
        },
      } as ReturnType<typeof getSiteConfig>)

      fetchSpy.mockResolvedValue(mockResponse(201))

      await subscribeNewsletter(validPayload)

      const [url] = fetchSpy.mock.calls[0] as [string]
      expect(url).toBe('https://worker-br.test/subscribe')
    })
  })
})

// -------------------------------------------------------------------------
// isNewsletterConfigured
// -------------------------------------------------------------------------
describe('isNewsletterConfigured', () => {
  afterEach(() => vi.clearAllMocks())

  it('retorna true quando workerUrl está configurado', () => {
    mockGetSiteConfig.mockReturnValue({
      newsletter: { workerUrl: 'https://worker.test', doubleOptIn: false },
    } as ReturnType<typeof getSiteConfig>)

    expect(isNewsletterConfigured()).toBe(true)
  })

  it('retorna false quando workerUrl é string vazia', () => {
    mockGetSiteConfig.mockReturnValue({
      newsletter: { workerUrl: '', doubleOptIn: false },
    } as ReturnType<typeof getSiteConfig>)

    expect(isNewsletterConfigured()).toBe(false)
  })

  it('retorna false quando newsletter é undefined', () => {
    mockGetSiteConfig.mockReturnValue({
      newsletter: undefined,
    } as unknown as ReturnType<typeof getSiteConfig>)

    expect(isNewsletterConfigured()).toBe(false)
  })
})
