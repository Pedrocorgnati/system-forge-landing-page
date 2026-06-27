'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Resolver de locale self-contained — o error boundary raiz ships em todos os builds
// e NAO deve depender de modulos da app (que podem ter causado o crash).
// NEXT_PUBLIC_LOCALE e inlinado por build; fallback pt-BR mantem compat mono-idioma.
type Locale = 'pt-BR' | 'it-IT' | 'en' | 'es-ES'

function resolveLocale(): Locale {
  const raw = process.env.NEXT_PUBLIC_LOCALE
  if (raw === 'it-IT' || raw === 'en' || raw === 'es-ES' || raw === 'pt-BR') {
    return raw
  }
  return 'pt-BR'
}

interface ErrorCopy {
  htmlLang: string
  title: string
  body: string
  codeLabel: string
  retry: string
}

const COPY: Record<Locale, ErrorCopy> = {
  'pt-BR': {
    htmlLang: 'pt-BR',
    title: 'Algo deu errado',
    body: 'Ocorreu um erro inesperado. Por favor, tente novamente ou recarregue a página.',
    codeLabel: 'Código:',
    retry: 'Tentar novamente',
  },
  'it-IT': {
    htmlLang: 'it',
    title: 'Qualcosa è andato storto',
    body: 'Si è verificato un errore imprevisto. Per favore, riprova o ricarica la pagina.',
    codeLabel: 'Codice:',
    retry: 'Riprova',
  },
  en: {
    htmlLang: 'en',
    title: 'Something went wrong',
    body: 'An unexpected error occurred. Please try again or reload the page.',
    codeLabel: 'Code:',
    retry: 'Try again',
  },
  'es-ES': {
    htmlLang: 'es',
    title: 'Algo salió mal',
    body: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo o recarga la página.',
    codeLabel: 'Código:',
    retry: 'Intentar de nuevo',
  },
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Logging minimo — nao depende de modulos externos que podem ter causado o erro
    const msg = error.digest
      ? `[GlobalError] digest=${error.digest}`
      : '[GlobalError] Erro no layout raiz'
    console.error(msg)
  }, [error])

  const copy = COPY[resolveLocale()]

  return (
    <html lang={copy.htmlLang}>
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
            {copy.title}
          </h1>
          <p style={{ color: '#555', maxWidth: '28rem', margin: 0 }}>
            {copy.body}
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', margin: 0 }}>
              {copy.codeLabel} {error.digest}
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
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  )
}
