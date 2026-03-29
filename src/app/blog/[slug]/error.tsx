'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { loadMessages } from '@config/content'
import { ROUTES } from '@/lib/constants/routes'

const m = loadMessages()

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BlogPostError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('[BlogPost] Erro ao carregar artigo', {
      digest: error.digest,
      action: 'blog-post-error',
      route: 'blog/[slug]',
    })
  }, [error])

  return (
    <main
      data-testid="blog-post-error"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
    >
      <h1 data-testid="blog-post-error-heading" className="text-3xl font-bold text-foreground">
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
          data-testid="blog-post-error-retry"
          onClick={reset}
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {m.pages.error.retry}
        </button>
        <Link
          href={ROUTES.BLOG}
          data-testid="blog-post-error-back"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {m.breadcrumb.blog}
        </Link>
      </div>
    </main>
  )
}
