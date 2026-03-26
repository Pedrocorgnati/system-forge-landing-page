/**
 * components/blog/CategoryFilter.tsx
 * Filtro de categorias/tags do blog por links estáticos.
 * Server Component — sem 'use client'.
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'

interface CategoryFilterProps {
  categories: string[]
  currentCategory?: string
}

export function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  return (
    <nav aria-label="Filtrar por categoria">
      <ul className="overflow-x-auto flex flex-wrap gap-2 pb-2">
        {/* "Todos" link */}
        <li>
          <Link
            href={ROUTES.BLOG}
            aria-current={!currentCategory ? 'page' : undefined}
            className={cn(
              'inline-block px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              !currentCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            Todos
          </Link>
        </li>

        {/* Category links */}
        {categories.map((cat) => {
          const isActive = currentCategory === cat
          return (
            <li key={cat}>
              <Link
                href={ROUTES.BLOG_CATEGORY(encodeURIComponent(cat))}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-block px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {cat}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
