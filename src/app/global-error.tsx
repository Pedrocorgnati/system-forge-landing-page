'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Logging minimo — nao depende de modulos externos que podem ter causado o erro
    const msg = error.digest
      ? `[GlobalError] digest=${error.digest}`
      : '[GlobalError] Erro no layout raiz'
    console.error(msg)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#111' }}>
        <main
          data-testid="global-error-boundary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1.5rem',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
            Algo deu errado
          </h1>
          <p style={{ color: '#555', maxWidth: '28rem', margin: 0 }}>
            Ocorreu um erro inesperado. Por favor, tente novamente ou recarregue a página.
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', margin: 0 }}>
              Código: {error.digest}
            </p>
          )}
          <button
            data-testid="global-error-retry-button"
            onClick={reset}
            type="button"
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              background: '#2563EB',
              color: '#fff',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
