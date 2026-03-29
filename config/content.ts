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
import esESMessages from '@content/es-ES/messages.json'

import ptBRPageMessages from '@content/pt-BR/pages/messages.json'
import itITPageMessages from '@content/it-IT/pages/messages.json'
import enPageMessages from '@content/en/pages/messages.json'
import esESPageMessages from '@content/es-ES/pages/messages.json'

import ptBRServices from '@content/pt-BR/pages/services.json'
import itITServices from '@content/it-IT/pages/services.json'
import enServices from '@content/en/pages/services.json'
import esESServices from '@content/es-ES/pages/services.json'

import ptBRPortfolio from '@content/pt-BR/pages/portfolio.json'
import itITPortfolio from '@content/it-IT/pages/portfolio.json'
import enPortfolio from '@content/en/pages/portfolio.json'
import esESPortfolio from '@content/es-ES/pages/portfolio.json'

const MESSAGES_MAP: Record<SupportedLocale, typeof ptBRMessages> = {
  'pt-BR': ptBRMessages,
  'it-IT': itITMessages,
  'en': enMessages,
  'es-ES': esESMessages,
}

const PAGE_MESSAGES_MAP: Record<SupportedLocale, typeof ptBRPageMessages> = {
  'pt-BR': ptBRPageMessages,
  'it-IT': itITPageMessages,
  'en': enPageMessages,
  'es-ES': esESPageMessages,
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

type ServiceBenefit = { icon: string; title: string; description: string }
type ServiceProcessStep = { step: number; title: string; description: string }
type ServiceFaqItem = { q: string; a: string }

type ServiceContentItem = {
  id: string
  title: string
  description: string
  longDescription?: string
  features: string[]
  benefits?: ServiceBenefit[]
  process?: ServiceProcessStep[]
  useCases?: string[]
  faq?: ServiceFaqItem[]
}

const SERVICES_CONTENT_MAP: Record<SupportedLocale, ServiceContentItem[]> = {
  'pt-BR': ptBRServices as ServiceContentItem[],
  'it-IT': itITServices as ServiceContentItem[],
  'en': enServices as ServiceContentItem[],
  'es-ES': esESServices as ServiceContentItem[],
}

/**
 * Carrega conteúdo de serviços para o locale atual do build.
 */
export function loadServicesContent(): ServiceContentItem[] {
  return SERVICES_CONTENT_MAP[getLocale()]
}

type PortfolioContentItem = { id: string; description: string; title?: string }

const PORTFOLIO_CONTENT_MAP: Record<SupportedLocale, PortfolioContentItem[]> = {
  'pt-BR': ptBRPortfolio as PortfolioContentItem[],
  'it-IT': itITPortfolio as PortfolioContentItem[],
  'en': enPortfolio as PortfolioContentItem[],
  'es-ES': esESPortfolio as PortfolioContentItem[],
}

/**
 * Carrega descrições de portfólio para o locale atual do build.
 * Retorna um Map de id -> description para merge rápido.
 */
export function loadPortfolioDescriptions(): Map<string, string> {
  const items = PORTFOLIO_CONTENT_MAP[getLocale()]
  return new Map(items.map(p => [p.id, p.description]))
}

/**
 * Carrega nome e descrição de portfólio para o locale atual do build.
 * Retorna um Map de id -> { name, description } para merge com portfolioProjects.
 */
export function loadPortfolioItems(): Map<string, { name: string; description: string }> {
  const items = PORTFOLIO_CONTENT_MAP[getLocale()]
  return new Map(items.map(p => [p.id, { name: p.title ?? p.id, description: p.description }]))
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
