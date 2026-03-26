import { ConversionAction, type CTAConfig } from './types'
import { SITE } from './constants'

// Validação de href de CTA — permite apenas URLs externas seguras
export function isAllowedCTAHref(href: string): boolean {
  try {
    const url = new URL(href)
    return ['https:', 'http:'].includes(url.protocol)
  } catch {
    // Links relativos (anchors, etc.) também são permitidos
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

export function buildDefaultCTAs(context?: string): CTAConfig[] {
  const waMessage = context
    ? `Olá! Vi seu site e tenho interesse em ${context}.`
    : 'Olá! Vi o site da SystemForge e gostaria de saber mais sobre os serviços.'

  return [
    {
      action: ConversionAction.WHATSAPP,
      label: 'Falar no WhatsApp',
      href: buildWhatsAppUrl(SITE.whatsapp, waMessage),
      variant: 'primary',
      icon: '💬',
    },
    {
      action: ConversionAction.CALENDLY,
      label: 'Agendar reunião',
      href: SITE.calendly,
      variant: 'secondary',
      icon: '📅',
    },
    {
      action: ConversionAction.BUDGET_ENGINE,
      label: 'Calcular orçamento grátis →',
      href: SITE.budgetEngine,
      variant: 'ghost',
    },
  ]
}

export function buildWhatsAppCTA(label: string, context?: string): CTAConfig {
  const message = context
    ? `Olá! Tenho interesse em ${context}.`
    : 'Olá! Vi o site da SystemForge e gostaria de saber mais.'

  return {
    action: ConversionAction.WHATSAPP,
    label,
    href: buildWhatsAppUrl(SITE.whatsapp, message),
    variant: 'primary',
    icon: '💬',
  }
}

export function buildBudgetCTA(label: string, context?: string): CTAConfig {
  const suffix = context ? `?context=${encodeURIComponent(context)}` : ''
  return {
    action: ConversionAction.BUDGET_ENGINE,
    label,
    href: `${SITE.budgetEngine}${suffix}`,
    variant: 'secondary',
  }
}
