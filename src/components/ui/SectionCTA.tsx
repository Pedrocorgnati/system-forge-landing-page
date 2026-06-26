'use client'

import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'
import { GA4_EVENTS } from '@/lib/constants/analytics'
import { capture as posthogCapture } from '@/lib/tracking/posthog'

type SectionCTAProps = {
  /** Identifica a secao de origem; vira ?context= no budget engine (mensuravel no destino). */
  context: string
  /** Texto curto opcional acima do botao. Ja deve vir localizado pelo chamador. */
  lead?: string
  className?: string
}

/**
 * CTA de conversao reaproveitavel pelas secoes da home.
 *
 * Destino locale-aware:
 *  - pt-BR: anchor on-page `#solicitar-escopo` (formulario de captacao da home).
 *  - demais mercados (it-IT, en, es-ES): budget engine externo (`config.budgetEngine`),
 *    com `?context=` preservando a secao de origem para atribuicao no destino.
 *
 * Renderiza um `<a>` puro: funciona sem JavaScript (regra de degradacao honesta).
 * O `onClick` apenas DISPARA tracking (GA4 + PostHog) e NAO faz preventDefault —
 * a navegacao do anchor continua nativa, mensuravel mesmo sem JS pelo href de
 * origem + submit/pageview do destino. Tracking dá paridade com `CTAButton`.
 */
export function SectionCTA({ context, lead, className }: SectionCTAProps) {
  const config = getSiteConfig()
  const m = loadMessages()
  const isPtBr = config.locale === 'pt-BR'

  let href: string
  if (isPtBr) {
    href = '#solicitar-escopo'
  } else {
    const sep = config.budgetEngine.includes('?') ? '&' : '?'
    href = `${config.budgetEngine}${sep}context=${encodeURIComponent(context)}`
  }

  const external = !isPtBr

  function handleClick() {
    // Não bloqueia a navegação nativa do <a>; só registra o evento.
    trackEvent(GA4_EVENTS.CTA_CLICKED, { action: 'section_cta', label: context })
    posthogCapture('cta_section_click', {
      source: 'section_cta',
      context,
      target: external ? 'budget_engine' : 'lead_form_anchor',
    })
  }

  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      {lead ? <p className="max-w-md text-sm text-muted-foreground leading-relaxed">{lead}</p> : null}
      <a
        href={href}
        onClick={handleClick}
        data-testid={`section-cta-${context}`}
        data-cta-context={context}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn(
          'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium',
          'border border-transparent bg-primary text-primary-foreground shadow-sm transition-all',
          'hover:bg-primary-hover hover:shadow-md hover:-translate-y-px active:scale-[0.98]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        )}
      >
        {m.cta.budget}
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  )
}
