'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/hooks/useCookieConsent'

export function GoogleAnalytics() {
  const { consent } = useCookieConsent()
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  // GA4 APENAS se analytics consent = true e measurement ID definido
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
