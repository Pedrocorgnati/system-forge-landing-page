/**
 * components/blog/CategoryFilter.tsx
 * Filtro de categorias/tags do blog por links estáticos.
 * Server Component — sem 'use client'.
 */
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'
import { loadMessages } from '@config/content'

const m = loadMessages()

interface CategoryFilterProps {
  categories: string[]
  currentCategory?: string
}

export function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  return (
    <nav data-testid="blog-category-filter" aria-label={m.sections.blog.categoryFilterAriaLabel}>
      <ul className="overflow-x-auto flex flex-wrap gap-2 pb-2">
        {/* "Todos" link */}
        <li>
          <Link
            data-testid="blog-category-filter-all"
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
                data-testid={`blog-category-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
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
