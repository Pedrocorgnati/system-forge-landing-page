/**
 * src/lib/content/__tests__/content-loader.integration.test.ts
 *
 * Testes de INTEGRAÇÃO do ContentLoader — lê arquivos reais do disco.
 * NÃO usa mocks de filesystem.
 *
 * Superfície testada: loadContent() → fs.existsSync + fs.readFileSync + Zod safeParse
 * Pré-condição: arquivos em content/{locale}/pages/{type}.json devem existir
 *
 * Cobertura:
 *   - 3 locales × 10 tipos = 30 combinações (Cenário 1 — happy path real)
 *   - Locale inexistente no disco (Cenário 2 — erro esperado)
 *   - Retorno nunca undefined — sempre objeto tipado ou exceção (Cenário 3)
 *
 * Diferença dos testes unitários:
 *   Unitários: mockam fs para isolar lógica
 *   Integração: exercitam a leitura real e validam que os 30 arquivos JSON
 *               do content layer estão presentes e conformes ao schema Zod
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import type { SupportedLocale } from '@config/types'
import type { ContentType } from '../content-loader'

// Cache do React como passthrough — cada chamada lê do disco diretamente.
// Necessário porque cache() requer AsyncLocalStorage do Next.js, que não existe em Vitest.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  }
})

const LOCALES: SupportedLocale[] = ['pt-BR', 'it-IT', 'en']

const CONTENT_TYPES: ContentType[] = [
  'messages',
  'services',
  'portfolio',
  'testimonials',
  'hero',
  'about',
  'advisor',
  'privacy',
  'contact',
  'faq',
]

let loadContent: (typeof import('../content-loader'))['loadContent']

beforeAll(async () => {
  const mod = await import('../content-loader')
  loadContent = mod.loadContent
})

describe('ContentLoader — integração com disco real', () => {
  // -------------------------------------------------------------------------
  // Cenário 1: Happy path — todos os arquivos existem e são válidos
  // -------------------------------------------------------------------------
  describe('Cenário 1: todos os 30 arquivos carregam e passam na validação Zod', () => {
    for (const locale of LOCALES) {
      describe(`Locale: ${locale}`, () => {
        for (const type of CONTENT_TYPES) {
          it(`${type}.json — carregado e validado com sucesso`, () => {
            expect(() => loadContent(type, locale)).not.toThrow()

            const result = loadContent(type, locale)
            expect(result).toBeDefined()
            expect(result).not.toBeNull()
            expect(typeof result).toBe('object')
          })
        }
      })
    }
  })

  // -------------------------------------------------------------------------
  // Cenário 2: Locale inexistente — erro [ContentLoader] esperado
  // Mapeia para ERROR-CATALOG: I18N_001 (locale não reconhecido)
  // -------------------------------------------------------------------------
  describe('Cenário 2: locale inexistente lança erro descritivo', () => {
    it('fr-FR não existe no disco — lança [ContentLoader] + "Arquivo não encontrado"', () => {
      expect(() =>
        loadContent('messages', 'fr-FR' as SupportedLocale)
      ).toThrow('[ContentLoader]')

      expect(() =>
        loadContent('messages', 'fr-FR' as SupportedLocale)
      ).toThrow('Arquivo não encontrado')
    })

    it('mensagem de erro contém o path do arquivo ausente', () => {
      expect(() =>
        loadContent('hero', 'fr-FR' as SupportedLocale)
      ).toThrow(/fr-FR/)
    })
  })

  // -------------------------------------------------------------------------
  // Cenário 3: Garantia de tipo — nunca retorna undefined
  // -------------------------------------------------------------------------
  describe('Cenário 3: retorno nunca undefined — sempre objeto ou exceção', () => {
    it('loadContent retorna objeto com keys para cada locale', () => {
      for (const locale of LOCALES) {
        const result = loadContent('messages', locale)
        expect(Object.keys(result).length).toBeGreaterThan(0)
      }
    })
  })
})
