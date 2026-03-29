'use client'

import { useEffect } from 'react'
import { loadMessages } from '@config/content'
import { logger } from '@/lib/logger'
import { trackEvent } from '@/lib/analytics'
import { GA4_EVENTS } from '@/lib/constants/analytics'

const messages = loadMessages()

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('[Error Boundary]', { digest: error.digest, action: 'root-error-boundary' })
    trackEvent(GA4_EVENTS.EXCEPTION, { description: error.message, fatal: false })
  }, [error])

  return (
    <main data-testid="error-boundary" className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 data-testid="error-boundary-heading" className="text-4xl font-bold text-foreground">{messages.pages.error.title}</h1>
      <p className="max-w-md text-muted-foreground">
        {messages.pages.error.description}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          {messages.pages.error.codeLabel}: {error.digest}
        </p>
      )}
      <button
        data-testid="error-boundary-retry-button"
        onClick={reset}
        type="button"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground transition-all hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        {messages.pages.error.retry}
      </button>
    </main>
  )
}
