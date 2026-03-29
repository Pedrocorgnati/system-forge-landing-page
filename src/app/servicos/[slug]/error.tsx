'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { loadMessages } from '@config/content'

const m = loadMessages()

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ServicoError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('[Servico] Erro ao carregar serviço', {
      digest: error.digest,
      action: 'servico-error',
      route: 'servicos/[slug]',
    })
  }, [error])

  return (
    <main
      data-testid="servico-error"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <h1 data-testid="servico-error-heading" className="text-3xl font-bold text-foreground">
        {m.pages.error.title}
      </h1>
      <p className="max-w-md text-muted-foreground">
        {m.pages.error.description}
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          {m.pages.error.codeLabel}: {error.digest}
        </p>
      )}
      <div className="flex gap-3 flex-col sm:flex-row">
        <button
          data-testid="servico-error-retry"
          onClick={reset}
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {m.pages.error.retry}
        </button>
        <Link
          href="/servicos"
          data-testid="servico-error-back"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {m.cta.services}
        </Link>
      </div>
    </main>
  )
}
