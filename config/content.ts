/**
 * config/content.ts
 * Content loading system for i18n triple-market.
 * Loads JSON content per locale at build time.
 */
import { getLocale } from './index'
import type { SupportedLocale } from './types'

import ptBRMessages from '@content/pt-BR/messages.json'
import itITMessages from '@content/it-IT/messages.json'
import enMessages from '@content/en/messages.json'

import ptBRPageMessages from '@content/pt-BR/pages/messages.json'
import itITPageMessages from '@content/it-IT/pages/messages.json'
import enPageMessages from '@content/en/pages/messages.json'

const MESSAGES_MAP: Record<SupportedLocale, typeof ptBRMessages> = {
  'pt-BR': ptBRMessages,
  'it-IT': itITMessages,
  'en': enMessages,
}

const PAGE_MESSAGES_MAP: Record<SupportedLocale, typeof ptBRPageMessages> = {
  'pt-BR': ptBRPageMessages,
  'it-IT': itITPageMessages,
  'en': enPageMessages,
}

/**
 * Carrega mensagens para o locale atual do build.
 */
export function loadMessages() {
  return MESSAGES_MAP[getLocale()]
}

/**
 * Carrega mensagens para um locale específico.
 */
export function loadMessagesFor(locale: SupportedLocale) {
  return MESSAGES_MAP[locale]
}

/**
 * Carrega mensagens de seções (pages/messages.json) para o locale atual.
 * Equivalente estático a loadContent('messages', locale) — funciona em Client Components.
 */
export function loadPageMessages() {
  return PAGE_MESSAGES_MAP[getLocale()]
}

/**
 * Helper para substituir placeholders em mensagens.
 * Ex: interpolate("Olá {name}", { name: "Pedro" }) → "Olá Pedro"
 */
export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  )
}
