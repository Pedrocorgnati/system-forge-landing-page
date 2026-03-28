'use client'

import Link from 'next/link'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { getSiteConfig } from '@config'
import type { LocaleMessages } from '@config'
import { loadMessages } from '@config/content'
import { cn } from '@/lib/utils'
import { CookieConsentModal } from './CookieConsentModal'

/* ------------------------------------------------------------------ */
/*  Shared button classes                                              */
/* ------------------------------------------------------------------ */

const btnBase =
  'h-10 px-4 rounded-md text-sm font-medium min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [touch-action:manipulation]'

const btnPrimary = cn(btnBase, 'bg-primary text-primary-foreground hover:bg-primary/90')
const btnOutline = cn(btnBase, 'border border-input bg-background hover:bg-accent')
const btnGhost = 'text-sm font-medium text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [touch-action:manipulation]'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CookieBanner() {
  const {
    hasConsented,
    consent,
    isModalOpen,
    openModal,
    closeModal,
    acceptAll,
    rejectAll,
    savePreferences,
  } = useCookieConsent()

  const config = getSiteConfig()
  const messages = loadMessages() as unknown as LocaleMessages
  const m = messages.cookie
  const framework = consent.framework

  // Hide once a decision has been made
  if (hasConsented) return null

  return (
    <>
      <div
        data-testid="cookie-banner"
        role="dialog"
        aria-modal="false"
        aria-label={m.title}
        className={cn(
          'fixed bottom-0 inset-x-0 z-50',
          'bg-background/95 backdrop-blur',
          'border-t border-border',
          'pb-[env(safe-area-inset-bottom)]',
          'animate-in slide-in-from-bottom duration-300',
        )}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Text block */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{m.title}</p>
              <p className="text-sm text-muted-foreground">
                {m.description}{' '}
                <Link
                  href={config.routes.privacy}
                  className="underline underline-offset-2 hover:text-primary transition-colors"
                >
                  {m.privacyLink}
                </Link>
                .
              </p>
              {m.legalReference && (
                <p className="text-xs text-muted-foreground/70">{m.legalReference}</p>
              )}
            </div>

            {/* Action buttons — vary by framework */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              {framework === 'LGPD' && (
                <>
                  <button
                    data-testid="cookie-banner-accept-button"
                    type="button"
                    className={btnPrimary}
                    onClick={acceptAll}
                    aria-label={m.acceptAll}
                  >
                    {m.acceptAll}
                  </button>
                  <button
                    data-testid="cookie-banner-reject-button"
                    type="button"
                    className={btnOutline}
                    onClick={rejectAll}
                    aria-label={m.reject}
                  >
                    {m.reject}
                  </button>
                </>
              )}

              {framework === 'GDPR' && (
                <>
                  <button
                    data-testid="cookie-banner-accept-button"
                    type="button"
                    className={btnPrimary}
                    onClick={acceptAll}
                    aria-label={m.acceptAll}
                  >
                    {m.acceptAll}
                  </button>
                  <button
                    data-testid="cookie-banner-reject-button"
                    type="button"
                    className={btnOutline}
                    onClick={rejectAll}
                    aria-label={m.reject}
                  >
                    {m.reject}
                  </button>
                  <button
                    data-testid="cookie-banner-manage-button"
                    type="button"
                    className={btnGhost}
                    onClick={openModal}
                    aria-label={m.managePreferences ?? 'Manage preferences'}
                  >
                    {m.managePreferences ?? 'Manage preferences'}
                  </button>
                </>
              )}

              {framework === 'CAN-SPAM' && (
                <button
                  data-testid="cookie-banner-accept-button"
                  type="button"
                  className={btnPrimary}
                  onClick={acceptAll}
                  aria-label={m.gotIt ?? m.acceptAll}
                >
                  {m.gotIt ?? m.acceptAll}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GDPR granular preferences modal */}
      {framework === 'GDPR' && isModalOpen && (
        <CookieConsentModal
          onClose={closeModal}
          onSave={savePreferences}
        />
      )}
    </>
  )
}
