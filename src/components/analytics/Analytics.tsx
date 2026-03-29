'use client'

import { useEffect } from 'react'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { getSiteConfig } from '@config'

/**
 * Conditionally loads GA4 based on cookie consent.
 *
 * - Script is injected via document.createElement — never via dangerouslySetInnerHTML.
 * - Only loads when the user has explicitly accepted analytics cookies.
 * - Re-triggers without page reload when consent changes (useEffect dependency).
 * - Ad-blocker / network errors are handled silently via script.onerror.
 * - Duplicate injection prevented by ID guard.
 *
 * INT-027 (COMP-005) — GA4 consent gate
 * module-11-cookie-compliance TASK-4/ST001
 */
export function Analytics() {
  const { consent } = useCookieConsent()
  const config = getSiteConfig()
  const measurementId = config.ga4MeasurementId

  const shouldLoadGA = consent.categories.analytics && !!measurementId

  useEffect(() => {
    if (!shouldLoadGA || !measurementId) return

    // Guard: prevent duplicate script injection
    if (document.getElementById('gtag-script')) {
      // Script already loaded — just re-configure (handles re-trigger after consent change)
      if (window.gtag) {
        window.gtag('config', measurementId, { page_path: window.location.pathname })
      }
      return
    }

    // Bootstrap dataLayer queue BEFORE script loads (gtag.js reads from it)
    window.dataLayer = window.dataLayer ?? []
    // eslint-disable-next-line prefer-rest-params
    if (!window.gtag) window.gtag = function () { window.dataLayer!.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      page_path: window.location.pathname,
      anonymize_ip: true,
    })

    // Inject gtag.js dynamically — no dangerouslySetInnerHTML
    const script = document.createElement('script')
    script.id = 'gtag-script'
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.async = true
    script.onerror = () => {
      // Silently handle ad-blocker / network errors — site continues normally
    }
    document.head.appendChild(script)
  }, [shouldLoadGA, measurementId])

  return null
}
