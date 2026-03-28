/**
 * components/blog/Pagination.tsx
 * Paginação estática via links para Server Components.
 * Retorna null se totalPages <= 1.
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
      aria-label="Paginação"
      className="flex items-center justify-center gap-4 mt-8"
    >
      {currentPage > 1 ? (
        <Link
          data-testid="blog-pagination-prev"
          href={prevHref}
          aria-label={`Ir para a página ${prevPage}`}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          )}
        >
          <span aria-hidden="true">←</span>
          Anterior
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none"
        >
          <span aria-hidden="true">←</span>
          Anterior
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
              aria-label={`Página ${page}, atual`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={pageHref}
              aria-label={`Ir para página ${page}`}
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
          aria-label={`Ir para a página ${nextPage}`}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          )}
        >
          Próxima
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground/40 cursor-not-allowed select-none"
        >
          Próxima
          <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  )
}
