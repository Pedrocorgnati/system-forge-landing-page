/**
 * components/blog/Pagination.tsx
 * Paginação estática via links para Server Components.
 * Retorna null se totalPages <= 1.
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { loadMessages } from '@config/content'
import { getLocale, type SupportedLocale } from '@config'

const m = loadMessages()

/**
 * Labels da paginação resolvidos pelo locale do build (`NEXT_PUBLIC_LOCALE`).
 * Inline Record (sem novas chaves em messages.json) — `{page}` interpolado nos
 * aria-labels. O wrapper <nav> usa `m.sections.blog.paginationAriaLabel`.
 */
interface PaginationCopy {
  prev: string
  next: string
  goToPage: (page: number) => string
  currentPage: (page: number) => string
}

const PAGINATION_COPY: Record<SupportedLocale, PaginationCopy> = {
  'pt-BR': {
    prev: 'Anterior',
    next: 'Próxima',
    goToPage: (page) => `Ir para a página ${page}`,
    currentPage: (page) => `Página ${page}, atual`,
  },
  'it-IT': {
    prev: 'Precedente',
    next: 'Successiva',
    goToPage: (page) => `Vai alla pagina ${page}`,
    currentPage: (page) => `Pagina ${page}, attuale`,
  },
  en: {
    prev: 'Previous',
    next: 'Next',
    goToPage: (page) => `Go to page ${page}`,
    currentPage: (page) => `Page ${page}, current`,
  },
  'es-ES': {
    prev: 'Anterior',
    next: 'Siguiente',
    goToPage: (page) => `Ir a la página ${page}`,
    currentPage: (page) => `Página ${page}, actual`,
  },
}

const copy = PAGINATION_COPY[getLocale()]

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const prevPage = currentPage - 1
  const nextPage = currentPage + 1

  // Página 1 não tem /page/1 — redireciona para basePath
  const prevHref = prevPage === 1 ? basePath : `${basePath}/page/${prevPage}`
  const nextHref = `${basePath}/page/${nextPage}`

  return (
    <nav
      data-testid="blog-pagination"
      aria-label={m.sections.blog.paginationAriaLabel}
      className="flex items-center justify-center gap-4 mt-8"
    >
      {currentPage > 1 ? (
        <Link
          data-testid="blog-pagination-prev"
          href={prevHref}
          aria-label={copy.goToPage(prevPage)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          )}
        >
          <span aria-hidden="true">←</span>
          {copy.prev}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none"
        >
          <span aria-hidden="true">←</span>
          {copy.prev}
        </span>
      )}

      <div className="flex items-center gap-1" aria-live="polite">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
          const pageHref = page === 1 ? basePath : `${basePath}/page/${page}`
          const isActive = page === currentPage
          return isActive ? (
            <span
              key={page}
              aria-current="page"
              aria-label={copy.currentPage(page)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={pageHref}
              aria-label={copy.goToPage(page)}
              className={cn(
                'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium',
                'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              )}
            >
              {page}
            </Link>
          )
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          data-testid="blog-pagination-next"
          href={nextHref}
          aria-label={copy.goToPage(nextPage)}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          )}
        >
          {copy.next}
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none"
        >
          {copy.next}
          <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  )
}
