/**
 * app/blog/page/[n]/page.tsx
 * Páginas paginadas do blog a partir da página 2.
 * Server Component.
 */
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { blog as allArticles } from '@/.velite'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { BlogListPage } from '@/components/blog/BlogListPage'
import { generatePageMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/constants/routes'
import { BLOG_ITEMS_PER_PAGE } from '@/lib/constants/site'
import type { ArticleFrontmatter } from '@/lib/types'

interface PageProps {
  params: Promise<{ n: string }>
}

export function generateStaticParams() {
  const totalPages = Math.ceil(allArticles.length / BLOG_ITEMS_PER_PAGE)
  return Array.from({ length: totalPages }, (_, i) => ({ n: String(i + 1) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { n } = await params
  const pageNum = parseInt(n, 10)
  const totalPages = Math.ceil(allArticles.length / BLOG_ITEMS_PER_PAGE)

  const alternates: Metadata['alternates'] = {
    canonical: ROUTES.BLOG_PAGE(pageNum),
  }
  if (pageNum > 2) alternates.previous = ROUTES.BLOG_PAGE(pageNum - 1)
  if (pageNum === 2) alternates.previous = ROUTES.BLOG
  if (pageNum < totalPages) alternates.next = ROUTES.BLOG_PAGE(pageNum + 1)

  return {
    ...generatePageMetadata({
      title: `Blog — Página ${pageNum} de ${totalPages}`,
      description: `Artigos sobre desenvolvimento de software, IA e estratégias de produto — página ${pageNum} do blog da SystemForge.`,
      path: ROUTES.BLOG_PAGE(pageNum),
    }),
    alternates,
  }
}

export default async function BlogPaginatedPage({ params }: PageProps) {
  const { n } = await params
  const pageNum = parseInt(n, 10)

  // Evitar conteúdo duplicado com /blog
  if (n === '1' || pageNum === 1) {
    redirect(ROUTES.BLOG)
  }

  const sorted = [...allArticles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const totalPages = Math.ceil(sorted.length / BLOG_ITEMS_PER_PAGE)

  if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
    notFound()
  }

  const start = (pageNum - 1) * BLOG_ITEMS_PER_PAGE
  const pageArticles = sorted.slice(start, start + BLOG_ITEMS_PER_PAGE) as ArticleFrontmatter[]

  const tagCounts = sorted.flatMap((a) => a.tags).reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1
    return acc
  }, {})
  const allCategories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag)

  const breadcrumbs = [
    { label: 'Blog', href: ROUTES.BLOG },
    { label: `Página ${pageNum}`, href: '' },
  ]

  return (
    <div data-testid={`page-blog-${pageNum}`} className="py-12 md:py-16 bg-background">
      <Container>
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />

          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Blog — Página {pageNum}
            </h1>
          </div>

          <BlogListPage
            articles={pageArticles}
            currentPage={pageNum}
            totalPages={totalPages}
            allCategories={allCategories}
          />
        </div>
      </Container>
    </div>
  )
}
