/**
 * components/blog/BlogListPage.tsx
 * Layout de listagem do blog: filtro, grid de artigos, paginação e slots.
 * Server Component — sem 'use client'.
 */
import type { ReactNode } from 'react'
import { ArticleCard } from './ArticleCard'
import { CategoryFilter } from './CategoryFilter'
import { Pagination } from './Pagination'
import { ROUTES } from '@/lib/constants/routes'
import { slugifyTag } from '@/lib/blog/tag-slug'
import type { ArticleFrontmatter } from '@/lib/types'
import { loadMessages } from '@config/content'

interface BlogListPageProps {
  articles: ArticleFrontmatter[]
  currentPage?: number
  totalPages?: number
  categoryFilter?: string
  tagFilter?: string
  showSearch?: boolean
  allCategories?: string[]
  searchSlot?: ReactNode
}

export function BlogListPage({
  articles,
  currentPage = 1,
  totalPages = 1,
  categoryFilter,
  tagFilter,
  showSearch = false,
  allCategories = [],
  searchSlot,
}: BlogListPageProps) {
  const m = loadMessages()
  const blogList = m.blog.list

  return (
    <div data-testid="blog-list" className="flex flex-col gap-8">
      {/* Search slot */}
      {showSearch && searchSlot}

      {/* Category filter */}
      {allCategories.length > 0 && (
        <CategoryFilter
          categories={allCategories}
          currentCategory={categoryFilter}
        />
      )}

      {/* Tag filter indicator */}
      {tagFilter && (
        <p className="text-sm text-muted-foreground">
          {blogList.tagFilter} <span className="font-medium text-foreground">{tagFilter}</span>
        </p>
      )}

      {/* Article grid or empty state */}
      {articles.length === 0 ? (
        <div data-testid="blog-list-empty-state" className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-border border-dashed bg-surface">
          <div
            className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-3xl"
            aria-hidden="true"
          >
            📭
          </div>
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {blogList.emptyTitle}
            </h2>
            <p className="text-muted-foreground max-w-sm">
              {categoryFilter
                ? blogList.emptyCategory.replace('{cat}', categoryFilter)
                : tagFilter
                  ? blogList.emptyTag.replace('{tag}', tagFilter)
                  : blogList.emptyDefault}
            </p>
          </div>
        </div>
      ) : (
        <div data-testid="blog-list-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={
            categoryFilter
              ? ROUTES.BLOG_CATEGORY(slugifyTag(categoryFilter))
              : tagFilter
                ? ROUTES.BLOG_TAG(slugifyTag(tagFilter))
                : ROUTES.BLOG
          }
        />
      )}
    </div>
  )
}
