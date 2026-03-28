/**
 * src/lib/__tests__/content-consistency.integration.test.ts
 *
 * Testes de INTEGRAÇÃO — consistência cross-locale do content layer.
 * Lê arquivos JSON reais do disco e valida paridade entre os 3 locales.
 *
 * Superfície testada:
 *   content/{locale}/pages/{type}.json — existência e paridade de keys
 *
 * Cobertura:
 *   Cenário 1 — Todos os 30 arquivos existem no disco
 *   Cenário 2 — messages.json: top-level keys idênticos em pt-BR / it-IT / en
 *   Cenário 3 — Todos os arquivos são JSON válido (não corrompido)
 *   Cenário 4 — Nenhum arquivo de conteúdo está vazio ({}  ou [])
 *
 * Este teste captura regressões de i18n — ex: adicionar uma key em pt-BR
 * sem replicar em it-IT e en.
 *
 * Referência ERROR-CATALOG: I18N_001 (locale não reconhecido), I18N_002 (key ausente)
 */

import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'

const LOCALES = ['pt-BR', 'it-IT', 'en'] as const
const CONTENT_TYPES = [
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
] as const

// process.cwd() em Vitest aponta para a raiz do workspace (onde package.json está)
const CONTENT_ROOT = path.join(process.cwd(), 'content')

function contentFilePath(locale: string, type: string): string {
  return path.join(CONTENT_ROOT, locale, 'pages', `${type}.json`)
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// -------------------------------------------------------------------------
// Cenário 1: Todos os 30 arquivos existem
// -------------------------------------------------------------------------
describe('Cenário 1: Existência dos 30 arquivos do content layer', () => {
  it('nenhum arquivo está ausente', () => {
    const missing: string[] = []

    for (const locale of LOCALES) {
      for (const type of CONTENT_TYPES) {
        const filePath = contentFilePath(locale, type)
        if (!fs.existsSync(filePath)) {
          missing.push(`${locale}/pages/${type}.json`)
        }
      }
    }

    expect(missing).toEqual([])
  })
})

// -------------------------------------------------------------------------
// Cenário 2: Paridade de top-level keys no messages.json (I18N_002)
// O pt-BR é a fonte de verdade — it-IT e en devem ter as mesmas keys
// -------------------------------------------------------------------------
describe('Cenário 2: messages.json — paridade de keys entre locales', () => {
  it('it-IT tem as mesmas top-level keys que pt-BR', () => {
    const brPath = contentFilePath('pt-BR', 'messages')
    const itPath = contentFilePath('it-IT', 'messages')

    const brKeys = Object.keys(readJsonFile(brPath) as object).sort()
    const itKeys = Object.keys(readJsonFile(itPath) as object).sort()

    expect(itKeys).toEqual(brKeys)
  })

  it('en tem as mesmas top-level keys que pt-BR', () => {
    const brPath = contentFilePath('pt-BR', 'messages')
    const enPath = contentFilePath('en', 'messages')

    const brKeys = Object.keys(readJsonFile(brPath) as object).sort()
    const enKeys = Object.keys(readJsonFile(enPath) as object).sort()

    expect(enKeys).toEqual(brKeys)
  })

  it('nenhum locale tem keys extras não presentes no pt-BR', () => {
    const brPath = contentFilePath('pt-BR', 'messages')
    const brKeys = new Set(Object.keys(readJsonFile(brPath) as object))

    for (const locale of ['it-IT', 'en'] as const) {
      const localePath = contentFilePath(locale, 'messages')
      const localeKeys = Object.keys(readJsonFile(localePath) as object)
      const extras = localeKeys.filter((k) => !brKeys.has(k))
      expect(extras, `${locale}/messages.json tem keys extras: ${extras.join(', ')}`).toEqual([])
    }
  })
})

// -------------------------------------------------------------------------
// Cenário 3: Todos os arquivos são JSON válido
// -------------------------------------------------------------------------
describe('Cenário 3: Todos os arquivos são JSON válido (não corrompido)', () => {
  it('nenhum arquivo lança erro no JSON.parse', () => {
    const invalid: string[] = []

    for (const locale of LOCALES) {
      for (const type of CONTENT_TYPES) {
        const filePath = contentFilePath(locale, type)
        if (!fs.existsSync(filePath)) continue

        try {
          JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        } catch {
          invalid.push(`${locale}/pages/${type}.json`)
        }
      }
    }

    expect(invalid).toEqual([])
  })
})

// -------------------------------------------------------------------------
// Cenário 4: Nenhum arquivo de conteúdo está vazio
// Um arquivo vazio ({} ou []) indica conteúdo não preenchido para o locale
// -------------------------------------------------------------------------
describe('Cenário 4: Nenhum arquivo está vazio ou sem conteúdo', () => {
  it('todos os arquivos têm pelo menos uma key de conteúdo', () => {
    const empty: string[] = []

    for (const locale of LOCALES) {
      for (const type of CONTENT_TYPES) {
        const filePath = contentFilePath(locale, type)
        if (!fs.existsSync(filePath)) continue

        const content = readJsonFile(filePath)
        const isEmpty =
          content === null ||
          (typeof content === 'object' && !Array.isArray(content) && Object.keys(content as object).length === 0) ||
          (Array.isArray(content) && (content as unknown[]).length === 0)

        if (isEmpty) {
          empty.push(`${locale}/pages/${type}.json`)
        }
      }
    }

    expect(empty).toEqual([])
  })
})
