'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { ROUTES } from '@/lib/constants/routes'

export function CookieBanner() {
  const { consent, setConsent, isLoaded } = useCookieConsent()

  // Não renderizar: (1) antes de carregar localStorage, (2) se já tem consentimento
  if (!isLoaded || consent !== null) {
    return null
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-md shadow-lg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            Usamos cookies para melhorar sua experiência e analisar o uso do site.{' '}
            <Link
              href={ROUTES.PRIVACY}
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Saiba mais
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-row gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConsent('rejected')}
            aria-label="Recusar cookies não essenciais"
          >
            Recusar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConsent('accepted')}
            aria-label="Aceitar todos os cookies"
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  )
}
