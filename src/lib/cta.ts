import { ConversionAction, type CTAConfig } from './types'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

export function isAllowedCTAHref(href: string): boolean {
  if (href.startsWith('mailto:')) return true
  try {
    const url = new URL(href)
    return ['https:', 'http:'].includes(url.protocol)
  } catch {
    return href.startsWith('/') || href.startsWith('#') || href.startsWith('wa.me')
  }
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return ''
  const base = `https://wa.me/${clean}`
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`
  }
  return base
}

/** True quando o locale tem linha WhatsApp configurada (env var ou fallback). */
export function hasWhatsApp(phone: string): boolean {
  return phone.replace(/\D/g, '').length > 0
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
  } else if (locale === 'es-ES') {
    waMessage = context
      ? `¡Hola! He visto vuestro sitio y estoy interesado en ${context}.`
      : '¡Hola! He visto el sitio de SystemForge y me gustaría saber más sobre los servicios.'
  } else {
    waMessage = context
      ? `Olá! Vi seu site e tenho interesse em ${context}.`
      : 'Olá! Vi o site da SystemForge e gostaria de saber mais sobre os serviços.'
  }

  const ctaList: CTAConfig[] = [
    {
      action: ConversionAction.BUDGET_ENGINE,
      label: m.cta.budget,
      href: config.budgetEngine,
      // Sem linha WhatsApp, budget assume slot 'primary' visualmente.
      variant: config.whatsapp ? 'ghost' : 'primary',
    },
  ]

  if (config.whatsapp) {
    ctaList.unshift({
      action: ConversionAction.WHATSAPP,
      label: m.cta.whatsapp,
      href: buildWhatsAppUrl(config.whatsapp, waMessage),
      variant: 'primary',
      icon: '💬',
    })
  }

  // Only include Calendly CTA if a URL is configured
  if (config.calendly) {
    ctaList.splice(1, 0, {
      action: ConversionAction.CALENDLY,
      label: m.cta.calendly,
      href: config.calendly,
      variant: 'secondary',
      icon: '📅',
    })
  }

  return ctaList
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
  } else if (locale === 'es-ES') {
    message = context
      ? `¡Hola! Estoy interesado en ${context}.`
      : '¡Hola! He visto el sitio de SystemForge y me gustaría saber más.'
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

/**
 * E-mail CTA (mailto:) — usa config.email por locale, com assunto/corpo
 * localizados (chaveia em 'en', NÃO 'en-US'). Sempre disponível (todo locale
 * tem email), inclusive ES (que não tem WhatsApp).
 */
export function buildEmailCTA(label: string, context?: string): CTAConfig {
  const config = getSiteConfig()
  const locale = config.locale
  let subject: string
  let body: string
  if (locale === 'it-IT') {
    subject = 'Contatto dal blog SystemForge'
    body = context
      ? `Ciao! Ho letto il vostro articolo e sono interessato a ${context}.`
      : 'Ciao! Ho letto il vostro blog e vorrei saperne di più sui vostri servizi.'
  } else if (locale === 'en') {
    subject = 'Inquiry from SystemForge blog'
    body = context
      ? `Hi! I read your article and I'm interested in ${context}.`
      : 'Hi! I read your blog and would like to know more about your services.'
  } else if (locale === 'es-ES') {
    subject = 'Contacto desde el blog SystemForge'
    body = context
      ? `¡Hola! He leído vuestro artículo y estoy interesado en ${context}.`
      : '¡Hola! He leído vuestro blog y me gustaría saber más sobre los servicios.'
  } else {
    subject = 'Contato via blog SystemForge'
    body = context
      ? `Olá! Li o artigo de vocês e tenho interesse em ${context}.`
      : 'Olá! Li o blog de vocês e gostaria de saber mais sobre os serviços.'
  }
  return {
    action: ConversionAction.EMAIL,
    label,
    href: `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    variant: 'secondary',
    icon: '✉️',
  }
}
