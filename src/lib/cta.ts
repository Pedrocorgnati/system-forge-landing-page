import { ConversionAction, type CTAConfig } from './types'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

export function isAllowedCTAHref(href: string): boolean {
  try {
    const url = new URL(href)
    return ['https:', 'http:'].includes(url.protocol)
  } catch {
    return href.startsWith('/') || href.startsWith('#') || href.startsWith('wa.me')
  }
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, '')}`
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`
  }
  return base
}

/**
 * Builds locale-aware default CTAs.
 */
export function buildDefaultCTAs(context?: string): CTAConfig[] {
  const config = getSiteConfig()
  const m = loadMessages()

  const locale = config.locale
  let waMessage: string
  if (locale === 'it-IT') {
    waMessage = context
      ? `Ciao! Ho visto il vostro sito e sono interessato a ${context}.`
      : 'Ciao! Ho visto il sito di SystemForge e vorrei saperne di più sui vostri servizi.'
  } else if (locale === 'en') {
    waMessage = context
      ? `Hi! I saw your website and I'm interested in ${context}.`
      : "Hi! I saw SystemForge's website and would like to know more about your services."
  } else {
    waMessage = context
      ? `Olá! Vi seu site e tenho interesse em ${context}.`
      : 'Olá! Vi o site da SystemForge e gostaria de saber mais sobre os serviços.'
  }

  return [
    {
      action: ConversionAction.WHATSAPP,
      label: m.cta.whatsapp,
      href: buildWhatsAppUrl(config.whatsapp, waMessage),
      variant: 'primary',
      icon: '💬',
    },
    {
      action: ConversionAction.CALENDLY,
      label: m.cta.calendly,
      href: config.calendly,
      variant: 'secondary',
      icon: '📅',
    },
    {
      action: ConversionAction.BUDGET_ENGINE,
      label: m.cta.budget,
      href: config.budgetEngine,
      variant: 'ghost',
    },
  ]
}

export function buildWhatsAppCTA(label: string, context?: string): CTAConfig {
  const config = getSiteConfig()
  const locale = config.locale
  let message: string
  if (locale === 'it-IT') {
    message = context
      ? `Ciao! Sono interessato a ${context}.`
      : 'Ciao! Ho visto il sito di SystemForge e vorrei saperne di più.'
  } else if (locale === 'en') {
    message = context
      ? `Hi! I'm interested in ${context}.`
      : "Hi! I saw SystemForge's website and would like to learn more."
  } else {
    message = context
      ? `Olá! Tenho interesse em ${context}.`
      : 'Olá! Vi o site da SystemForge e gostaria de saber mais.'
  }

  return {
    action: ConversionAction.WHATSAPP,
    label,
    href: buildWhatsAppUrl(config.whatsapp, message),
    variant: 'primary',
    icon: '💬',
  }
}

export function buildBudgetCTA(label: string, context?: string): CTAConfig {
  const config = getSiteConfig()
  const sep = config.budgetEngine.includes('?') ? '&' : '?'
  const suffix = context ? `${sep}context=${encodeURIComponent(context)}` : ''
  return {
    action: ConversionAction.BUDGET_ENGINE,
    label,
    href: `${config.budgetEngine}${suffix}`,
    variant: 'secondary',
  }
}
