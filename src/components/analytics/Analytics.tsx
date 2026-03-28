'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { getSiteConfig } from '@config'

/**
 * Conditionally loads GA4 based on cookie consent.
 * Only injects the gtag script when the user has explicitly
 * accepted analytics cookies AND a GA4 measurement ID exists.
 */
export function Analytics() {
  const { consent } = useCookieConsent()
  const config = getSiteConfig()
  const measurementId = config.ga4MeasurementId

  if (!consent.categories.analytics || !measurementId) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        id="gtag-script"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure',
            });
          `,
        }}
      />
    </>
  )
}
