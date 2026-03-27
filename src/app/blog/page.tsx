import type { Metadata } from 'next'
import { blog as allArticles } from '@/.velite'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { BlogListPage } from '@/components/blog/BlogListPage'
import { SITE, ROUTES } from '@/lib/constants'
import { BLOG_ITEMS_PER_PAGE } from '@/lib/constants/site'
import type { ArticleFrontmatter } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Blog',
  description: `Artigos sobre desenvolvimento de software, tecnologia e estratégias de produto. Blog da ${SITE.name}.`,
  alternates: { canonical: '/blog' },
}

const breadcrumbs = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Blog', href: ROUTES.blog },
]

export default function BlogPage() {
  const sorted = [...allArticles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  const totalPages = Math.ceil(sorted.length / BLOG_ITEMS_PER_PAGE)
  const pageArticles = sorted.slice(0, BLOG_ITEMS_PER_PAGE) as ArticleFrontmatter[]

  const tagCounts = sorted.flatMap((a) => a.tags).reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1
    return acc
  }, {})
  const allCategories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag)

  return (
    <div data-testid="page-blog" className="py-12 md:py-16 bg-background">
      <Container>
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />

          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">Blog</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Conteúdo sobre desenvolvimento de software, arquitetura, IA e estratégias
              para crescimento de produtos digitais.
            </p>
          </div>

          <BlogListPage
            articles={pageArticles}
            currentPage={1}
            totalPages={totalPages}
            allCategories={allCategories}
          />
        </div>
      </Container>
    </div>
  )
}
