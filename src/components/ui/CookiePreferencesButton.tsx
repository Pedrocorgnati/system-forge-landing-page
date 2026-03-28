'use client'

import { useCookieConsent } from '@/hooks/useCookieConsent'
import type { LocaleMessages } from '@config'
import { loadMessages } from '@config/content'

export function CookiePreferencesButton() {
  const { resetConsent } = useCookieConsent()
  const messages = loadMessages() as unknown as LocaleMessages
  const label = messages.cookie?.cookiePreferences ?? 'Cookie Preferences'

  return (
    <button
      type="button"
      data-testid="footer-cookie-preferences"
      onClick={resetConsent}
      className="text-sm text-foreground/60 hover:text-foreground transition-colors"
    >
      {label}
    </button>
  )
}
