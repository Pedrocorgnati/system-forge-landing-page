'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Error Boundary]', error)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      })
    }
  }, [error])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">Algo deu errado</h1>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Tente novamente ou entre em contato se o problema persistir.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Código: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        type="button"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-base font-medium text-primary-foreground transition-all hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
      >
        Tentar novamente
      </button>
    </main>
  )
}
