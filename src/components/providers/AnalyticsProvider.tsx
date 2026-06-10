'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { getSiteConfig } from '@config'
import { capture, initPostHog, isReady } from '@/lib/tracking/posthog'

/**
 * AnalyticsProvider — montado em src/app/layout.tsx (task-009).
 *
 * Responsabilidades:
 *   1. Inicializa PostHog (defer/lazy) quando consent.analytics === true E
 *      pathname NAO esta sob /blog (regra Zero blog-impact).
 *   2. Dispara `landing_view` na montagem inicial e quando o pathname muda
 *      dentro do escopo landing (excluindo /blog).
 *   3. Atua como click delegator global: captura cliques em elementos com
 *      atributo `data-track-event="..."` e dispara o evento PostHog
 *      correspondente. Props adicionais via `data-track-prop-{nome}="valor"`.
 *
 * Out-of-scope (deviation explicita):
 *   - `lead_qualified` server-side: build usa `output: 'export'` (static) que
 *     proibe route handlers — `lead_qualified` e disparado client-side dentro
 *     do LeadQualifierForm apos validacao Zod passar (mesmo semantico, sem
 *     servidor disponivel).
 *   - `meeting_scheduled`: requer Cal.com webhook (locked Sprint 1 explicito
 *     na task body) — tracking manual no operador apos confirmacao. Evento
 *     declarado como canonico mas wiring automatico fora de escopo task-009.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { consent } = useCookieConsent()
  const lastViewKey = useRef<string | null>(null)
  const initializedRef = useRef(false)

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  const isBlogScope = pathname?.startsWith('/blog') ?? false
  const analyticsAllowed = consent.categories.analytics === true
  const trackingEnabled = !isBlogScope && analyticsAllowed && Boolean(apiKey)

  useEffect(() => {
    if (!trackingEnabled) return
    if (initializedRef.current) return
    initializedRef.current = true

    const config = getSiteConfig()
    // Session replay so habilita quando explicitamente acordado em fase
    // operacional posterior (banner LGPD diferenciado, ou env var dedicada).
    // Default seguro: desligado mesmo com analytics aceito.
    const enableSessionReplay =
      process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY === 'true'

    initPostHog({
      apiKey,
      apiHost,
      locale: config.locale,
      enableSessionReplay,
      superProperties: {
        site: config.siteName,
      },
    })
  }, [trackingEnabled, apiKey, apiHost])

  useEffect(() => {
    if (!trackingEnabled) return
    if (!pathname) return
    if (lastViewKey.current === pathname) return
    lastViewKey.current = pathname
    if (!isReady()) {
      // Posthog snippet bootstrapa fila — capture inicial fica enfileirado
      // ate o bundle carregar. Seguir mesmo assim.
    }
    capture('landing_view', { path: pathname })
  }, [pathname, trackingEnabled])

  useEffect(() => {
    if (!trackingEnabled) return

    function onClick(ev: MouseEvent): void {
      const target = ev.target
      if (!(target instanceof Element)) return
      const el = target.closest('[data-track-event]') as HTMLElement | null
      if (!el) return
      const event = el.getAttribute('data-track-event')
      if (!event) return
      const props: Record<string, string> = {}
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-track-prop-')) {
          const key = attr.name.replace('data-track-prop-', '')
          props[key] = attr.value
        }
      }
      capture(event, props)
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => {
      document.removeEventListener('click', onClick, { capture: true } as EventListenerOptions)
    }
  }, [trackingEnabled])

  return <>{children}</>
}
