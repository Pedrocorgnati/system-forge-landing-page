/**
 * src/lib/content/content-loader.ts
 * Carrega arquivos JSON da content layer por locale, valida com o schema Zod
 * correspondente e implementa cache em memória para build time.
 *
 * CONTEXTO DE EXECUÇÃO — ESTÁTICO:
 * Este projeto usa `output: 'export'` (Next.js static export) hospedado no Hostinger Shared.
 * O `loadContent` é chamado EXCLUSIVAMENTE durante `next build` — nunca em runtime no servidor.
 * O `cache()` do React deduplica chamadas dentro do mesmo processo Node.js de build.
 * Cada `next build` inicia um processo novo e relê tudo do zero.
 *
 * CACHE POR PROCESSO DE BUILD — NÃO por request HTTP.
 */

import { cache } from 'react'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import type { SupportedLocale } from '@config/types'

import {
  MessagesSchema,
  ServicesSchema,
  PortfolioSchema,
  TestimonialsSchema,
  HeroSchema,
  AboutSchema,
  AdvisorSchema,
  PrivacySchema,
  ContactSchema,
  FaqSchema,
} from './schemas'
import type {
  Messages,
  ServicesContent,
  PortfolioContent,
  TestimonialsContent,
  HeroContent,
  AboutContent,
  AdvisorContent,
  PrivacyContent,
  ContactContent,
  FaqContent,
} from './types'

// Mapa de tipos disponíveis para loadContent
export type ContentType =
  | 'messages'
  | 'services'
  | 'portfolio'
  | 'testimonials'
  | 'hero'
  | 'about'
  | 'advisor'
  | 'privacy'
  | 'contact'
  | 'faq'

// Mapa de ContentType → tipo de retorno
type ContentTypeMap = {
  messages: Messages
  services: ServicesContent
  portfolio: PortfolioContent
  testimonials: TestimonialsContent
  hero: HeroContent
  about: AboutContent
  advisor: AdvisorContent
  privacy: PrivacyContent
  contact: ContactContent
  faq: FaqContent
}

// Mapa de ContentType → schema Zod correspondente
// schemaMap NÃO é exportado — encapsulado neste módulo
const schemaMap: Record<ContentType, z.ZodSchema> = {
  messages: MessagesSchema,
  services: ServicesSchema,
  portfolio: PortfolioSchema,
  testimonials: TestimonialsSchema,
  hero: HeroSchema,
  about: AboutSchema,
  advisor: AdvisorSchema,
  privacy: PrivacySchema,
  contact: ContactSchema,
  faq: FaqSchema,
}

/**
 * Carrega e valida um arquivo JSON da content layer por tipo e locale.
 *
 * Usa `cache()` do React para deduplicar chamadas com os mesmos argumentos
 * dentro do mesmo processo de build. Cada build posterior relê do zero.
 *
 * @param type   - Tipo de conteúdo (chave de ContentType)
 * @param locale - Locale suportado (SupportedLocale: 'pt-BR' | 'it-IT' | 'en')
 * @returns Conteúdo validado e tipado pelo schema correspondente
 * @throws Error descritivo com [ContentLoader] prefix se arquivo ausente, JSON inválido ou schema falhar
 */
export const loadContent = cache(
  <T extends ContentType>(type: T, locale: SupportedLocale): ContentTypeMap[T] => {
    const filePath = path.join(
      process.cwd(),
      'content',
      locale,
      'pages',
      `${type}.json`
    )

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `[ContentLoader] Arquivo não encontrado: ${filePath}`
      )
    }

    let raw: unknown
    try {
      raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (err) {
      throw new Error(
        `[ContentLoader] JSON inválido em ${filePath}: ${(err as Error).message}`
      )
    }

    const result = schemaMap[type].safeParse(raw)
    if (!result.success) {
      throw new Error(
        `[ContentLoader] Validação falhou para ${type}/${locale}: ${result.error.message}`
      )
    }

    return result.data as ContentTypeMap[T]
  }
)
