/**
 * lib/constants/messages.ts
 * Mensagens de feedback para o usuário.
 * Delegam para loadMessages() — locale-aware desde i18n-triple-market.
 */
import { loadMessages } from '@config/content'

const m = loadMessages()

export const MESSAGES = {
  // Newsletter
  SUCCESS_NEWSLETTER: m.newsletter.success,
  ERROR_NEWSLETTER_DUPLICATE: m.errors.generic,
  ERROR_NEWSLETTER_INVALID: m.errors.generic,
  ERROR_NEWSLETTER_GENERIC: m.newsletter.error,

  // Formulário de contato
  SUCCESS_CONTACT: m.errors.generic,
  ERROR_CONTACT_GENERIC: m.errors.generic,

  // Erros genéricos
  ERROR_GENERIC: m.errors.generic,
  ERROR_NOT_FOUND: m.errors.notFound,
  ERROR_NETWORK: m.errors.network,

  // Estados vazios
  EMPTY_PORTFOLIO: m.empty.portfolio,
  EMPTY_BLOG: m.empty.blog,
  EMPTY_SEARCH: (query: string) => m.empty.search.replace('{query}', query),

  // Loading
  LOADING_GENERIC: m.loading.generic,
  LOADING_SEARCH: m.loading.search,

  // CTAs
  CTA_WHATSAPP: m.cta.whatsapp,
  CTA_CALENDLY: m.cta.calendly,
  CTA_BUDGET: m.cta.budget,
  CTA_CONTACT: m.cta.contact,
  CTA_PORTFOLIO: m.cta.portfolio,
  CTA_SERVICES: m.cta.services,
  CTA_READ_MORE: m.cta.readMore,

  // Acessibilidade
  ARIA_MENU_TOGGLE: m.accessibility.menuToggle,
  ARIA_CLOSE: m.accessibility.close,
  ARIA_EXTERNAL_LINK: m.accessibility.externalLink,
} as const
