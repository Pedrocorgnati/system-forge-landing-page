/**
 * app/blog/tag/[tag]/page.tsx
 * Página de listagem de artigos por tag.
 * Server Component.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { blog as allArticles } from '@/.velite'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { BlogListPage } from '@/components/blog/BlogListPage'
import { generatePageMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/constants/routes'
import { BLOG_ITEMS_PER_PAGE } from '@/lib/constants/site'
import { loadMessages } from '@config/content'

const messages = loadMessages()
import type { ArticleFrontmatter } from '@/lib/types'

interface PageProps {
  params: Promise<{ tag: string }>
}

export function generateStaticParams() {
  const tags = [...new Set(allArticles.flatMap((a) => a.tags))]
  return tags.map((tag) => ({ tag: encodeURIComponent(tag) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return generatePageMetadata({
    title: `#${decoded} — Blog SystemForge`,
    description: `Artigos com a tag "${decoded}" no blog da SystemForge.`,
    path: ROUTES.BLOG_TAG(tag),
    noIndex: true,
  })
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)

  // Verificar se a tag existe
  const allTags = [...new Set(allArticles.flatMap((a) => a.tags))]
  if (!allTags.includes(decoded)) {
    notFound()
  }

  const sorted = [...allArticles]
    .filter((a) => a.tags.includes(decoded))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalPages = Math.ceil(Math.max(sorted.length, 1) / BLOG_ITEMS_PER_PAGE)
  const pageArticles = sorted.slice(0, BLOG_ITEMS_PER_PAGE) as ArticleFrontmatter[]

  const tagCounts = allArticles.flatMap((a) => a.tags).reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1
    return acc
  }, {})
  const allCategories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag)

  const breadcrumbs = [
    { label: messages.breadcrumb.blog, href: ROUTES.BLOG },
    { label: `#${decoded}`, href: '' },
  ]

  return (
    <div data-testid={`page-blog-tag-${tag}`} className="py-12 md:py-16 bg-background">
      <Container>
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />

          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              #{decoded}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {sorted.length === 0
                ? `Nenhum artigo encontrado com esta tag.`
                : `${sorted.length} ${sorted.length === 1 ? 'artigo' : 'artigos'} com esta tag.`}
            </p>
          </div>

          <BlogListPage
            articles={pageArticles}
            currentPage={1}
            totalPages={totalPages}
            tagFilter={decoded}
            allCategories={allCategories}
          />
        </div>
      </Container>
    </div>
  )
}
