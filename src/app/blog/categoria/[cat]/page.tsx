/**
 * app/blog/categoria/[cat]/page.tsx
 * Página de listagem de artigos por categoria (tag).
 * Server Component.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { blog as allArticles } from '@/.velite'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { JsonLdBreadcrumb } from '@/components/seo/JsonLdBreadcrumb'
import { BlogListPage } from '@/components/blog/BlogListPage'
import { JsonLd } from '@/components/ui/JsonLd'
import { generatePageMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/constants/routes'
import { slugifyTag, resolveTagFromSlug } from '@/lib/blog/tag-slug'
import { BLOG_ITEMS_PER_PAGE } from '@/lib/constants/site'
import type { ArticleFrontmatter } from '@/lib/types'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()

interface PageProps {
  params: Promise<{ cat: string }>
}

export function generateStaticParams() {
  // Slug URL-safe (sem espaço/acento) — evita arquivos estáticos com espaço que
  // quebram o upload SFTP e dão 404 no LiteSpeed.
  const slugs = [...new Set(allArticles.flatMap((a) => a.tags).map(slugifyTag))]
  return slugs.map((cat) => ({ cat }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cat } = await params
  const allCategories = [...new Set(allArticles.flatMap((a) => a.tags))]
  const decoded = resolveTagFromSlug(cat, allCategories) ?? cat
  return generatePageMetadata({
    title: `${decoded} — Blog ${config.siteName}`,
    description: `Artigos sobre ${decoded} no blog da ${config.siteName}.`,
    path: ROUTES.BLOG_CATEGORY(cat),
  })
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { cat } = await params

  // Resolve o slug -> tag original; 404 se nenhuma tag mapeia para o slug.
  const allCategories = [...new Set(allArticles.flatMap((a) => a.tags))]
  const decoded = resolveTagFromSlug(cat, allCategories)
  if (!decoded) {
    notFound()
  }

  const sorted = [...allArticles]
    .filter((a) => a.tags.some((t) => slugifyTag(t) === cat))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Não existe rota paginada por categoria (/blog/categoria/[cat]/page/[n]),
  // então forçamos 1 página para não renderizar links de paginação mortos.
  const totalPages = 1
  const pageArticles = sorted.slice(0, BLOG_ITEMS_PER_PAGE) as ArticleFrontmatter[]

  // Top 8 tags globais por frequência — consistente com a página principal do blog
  const tagCounts = allArticles.flatMap((a) => a.tags).reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1
    return acc
  }, {})
  const topCategories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag)

  const breadcrumbs = [
    { label: messages.breadcrumb.blog, href: ROUTES.BLOG },
    { label: decoded, href: '' },
  ]

  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${decoded} — Blog ${config.siteName}`,
    description: `Artigos sobre ${decoded} no blog da ${config.siteName}.`,
    url: `${config.url}${ROUTES.BLOG_CATEGORY(cat)}`,
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      url: config.url,
    },
  }

  const breadcrumbSchemaItems = [
    { label: 'Home', url: config.routes.home },
    { label: 'Blog', url: config.routes.blog },
    { label: decoded, url: ROUTES.BLOG_CATEGORY(cat) },
  ]

  return (
    <>
      <JsonLd schema={categorySchema} />
      <JsonLdBreadcrumb items={breadcrumbSchemaItems} />
      <div data-testid={`page-blog-category-${cat}`} className="py-12 md:py-16 bg-background">
      <Container>
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />

          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight capitalize">
              {decoded}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {sorted.length === 0
                ? messages.empty.blog
                : `${sorted.length} ${sorted.length === 1 ? 'artigo' : 'artigos'} nesta categoria.`}
            </p>
          </div>

          <BlogListPage
            articles={pageArticles}
            currentPage={1}
            totalPages={totalPages}
            categoryFilter={decoded}
            allCategories={topCategories}
          />
        </div>
      </Container>
    </div>
    </>
  )
}
