/**
 * src/lib/content/__tests__/content-loader.test.ts
 * Testes unitários do ContentLoader.
 * Usa mocks de filesystem (fs) para isolar testes do disco real.
 *
 * Cenários cobertos:
 * 1. Carga com sucesso — retorna objeto validado pelo schema
 * 2. Arquivo inexistente — lança Error com [ContentLoader] + path
 * 3. JSON malformado — lança erro com referência ao arquivo
 * 4. Schema Zod falha — lança Error com [ContentLoader] + "Validação falhou"
 * 5. Cache — segunda chamada não relê o filesystem
 *
 * NOTA: O cache() do React pode não se comportar como cache real em ambiente
 * de teste (sem o contexto AsyncLocalStorage do Next.js). Se o teste do cache
 * falhar por isso, considerar mock manual do cache ou wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'

// Mockar o módulo fs antes de importar o loadContent
vi.mock('fs')

const mockedFs = vi.mocked(fs)

// Payload válido para MessagesSchema
const validMessages = {
  hero: { titulo: 'Título', subtitulo: 'Sub', cta_primary: 'CTA1', cta_secondary: 'CTA2' },
  services: {
    titulo_secao: 'Serviços',
    subtitulo: 'Sub',
    cta_ver_mais: 'Ver mais',
    cta_orcamento: 'Orçamento',
    empty_state: 'Vazio',
  },
  portfolio: {
    titulo_secao: 'Portfolio',
    subtitulo: 'Sub',
    cta_ver_projeto: 'Ver',
    filtro_todos: 'Todos',
  },
  testimonials: { titulo_secao: 'Depoimentos', subtitulo: 'Sub', cta_ver_todos: 'Ver todos' },
  newsletter: {
    titulo: 'Newsletter',
    subtitulo: 'Sub',
    placeholder_email: 'email@ex.com',
    cta_assinar: 'Assinar',
    msg_sucesso: 'Inscrito!',
  },
  contact: {
    titulo_secao: 'Contato',
    subtitulo: 'Sub',
    cta_whatsapp: 'WhatsApp',
    cta_calendly: 'Agendar',
    cta_email: 'Email',
  },
  common: {
    voltar: 'Voltar',
    ler_mais: 'Ler mais',
    carregando: 'Carregando...',
    erro_generico: 'Erro',
    sem_resultados: 'Sem resultados',
    fechar: 'Fechar',
  },
}

describe('ContentLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.resetModules()
  })

  describe('Cenário 1: Carga com sucesso', () => {
    it('retorna objeto validado quando arquivo existe e JSON é válido', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(validMessages))

      // Importar após reset de módulos para garantir instância fresca
      const { loadContent } = await import('../content-loader')

      const result = loadContent('messages', 'pt-BR')

      expect(result).toEqual(validMessages)
      expect(mockedFs.existsSync).toHaveBeenCalledOnce()
      expect(mockedFs.readFileSync).toHaveBeenCalledOnce()
    })

    it('path do arquivo inclui locale e tipo corretos', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(validMessages))

      const { loadContent } = await import('../content-loader')
      loadContent('messages', 'it-IT')

      const calledPath = String(mockedFs.existsSync.mock.calls[0][0])
      expect(calledPath).toContain('it-IT')
      expect(calledPath).toContain('messages.json')
      expect(calledPath).toContain('pages')
    })
  })

  describe('Cenário 2: Arquivo inexistente', () => {
    it('lança Error com [ContentLoader] e path quando arquivo não existe', async () => {
      mockedFs.existsSync.mockReturnValue(false)

      const { loadContent } = await import('../content-loader')

      expect(() => loadContent('services', 'en')).toThrowError(/\[ContentLoader\]/)
      expect(() => loadContent('services', 'en')).toThrowError(/Arquivo não encontrado/)
      // readFileSync NÃO deve ser chamado
      expect(mockedFs.readFileSync).not.toHaveBeenCalled()
    })

    it('mensagem de erro contém o path absoluto', async () => {
      mockedFs.existsSync.mockReturnValue(false)

      const { loadContent } = await import('../content-loader')

      expect(() => loadContent('services', 'pt-BR')).toThrowError(
        /content[/\\]pt-BR[/\\]pages[/\\]services\.json/
      )
    })
  })

  describe('Cenário 3: JSON malformado', () => {
    it('lança erro quando readFileSync retorna JSON inválido', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue('{ invalid json }')

      const { loadContent } = await import('../content-loader')

      expect(() => loadContent('hero', 'pt-BR')).toThrowError(/\[ContentLoader\]/)
    })
  })

  describe('Cenário 4: Schema Zod falha na validação', () => {
    it('lança Error com [ContentLoader] + "Validação falhou" quando schema rejeita', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      // Objeto inválido: falta o campo obrigatório 'hero'
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({ invalid: true }))

      const { loadContent } = await import('../content-loader')

      expect(() => loadContent('messages', 'pt-BR')).toThrowError(/\[ContentLoader\]/)
      expect(() => loadContent('messages', 'pt-BR')).toThrowError(/Validação falhou/)
    })

    it('mensagem de erro identifica type e locale', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({ missing: 'required fields' }))

      const { loadContent } = await import('../content-loader')

      expect(() => loadContent('contact', 'en')).toThrowError(/contact/)
      expect(() => loadContent('contact', 'en')).toThrowError(/en/)
    })

    it('nunca retorna undefined — sempre lança erro ou retorna valor válido', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify({}))

      const { loadContent } = await import('../content-loader')

      expect(() => loadContent('messages', 'pt-BR')).toThrow()
    })
  })

  describe('Cenário 5: Cache — segunda chamada não relê o filesystem', () => {
    it('segunda chamada com mesmos args não aciona fs.readFileSync novamente', async () => {
      // Mock do React cache() com memoização manual via Map
      // Necessário porque cache() do React requer AsyncLocalStorage do Next.js
      const cacheMap = new Map<string, unknown>()
      vi.doMock('react', () => ({
        cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
          const cached = (...args: unknown[]) => {
            const key = JSON.stringify(args)
            if (cacheMap.has(key)) return cacheMap.get(key)
            const result = fn(...args)
            cacheMap.set(key, result)
            return result
          }
          return cached as unknown as T
        },
      }))

      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(validMessages))

      const { loadContent } = await import('../content-loader')

      const result1 = loadContent('messages', 'pt-BR')
      const result2 = loadContent('messages', 'pt-BR')

      // fs.readFileSync deve ter sido chamado apenas 1 vez (cache hit na segunda)
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('cache não compartilha entre locales diferentes', async () => {
      const cacheMap = new Map<string, unknown>()
      vi.doMock('react', () => ({
        cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
          const cached = (...args: unknown[]) => {
            const key = JSON.stringify(args)
            if (cacheMap.has(key)) return cacheMap.get(key)
            const result = fn(...args)
            cacheMap.set(key, result)
            return result
          }
          return cached as unknown as T
        },
      }))

      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(validMessages))

      const { loadContent } = await import('../content-loader')

      loadContent('messages', 'pt-BR')
      loadContent('messages', 'it-IT')

      // Dois locales diferentes = 2 chamadas ao fs
      expect(mockedFs.readFileSync).toHaveBeenCalledTimes(2)
    })
  })
})
