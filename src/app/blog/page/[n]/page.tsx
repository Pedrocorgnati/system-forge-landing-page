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
import { JsonLdBreadcrumb } from '@/components/seo/JsonLdBreadcrumb'
import { BlogListPage } from '@/components/blog/BlogListPage'
import { generatePageMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/constants/routes'
import { BLOG_ITEMS_PER_PAGE } from '@/lib/constants/site'
import { getSiteConfig, getLocale, type SupportedLocale } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()
const pageLabel = config.locale === 'it-IT' ? 'Pagina' : config.locale === 'en' ? 'Page' : 'Página'
import type { ArticleFrontmatter } from '@/lib/types'

/**
 * Metadata SEO das páginas paginadas, resolvida pelo locale do build
 * (`NEXT_PUBLIC_LOCALE`). Inline Record (sem novas chaves em messages.json),
 * com `{page}`/`{total}` interpolados. Tom alinhado à metadata do /blog.
 */
interface PaginatedMeta {
  title: (page: number, total: number) => string
  description: (page: number) => string
}

const PAGINATED_META: Record<SupportedLocale, PaginatedMeta> = {
  'pt-BR': {
    title: (page, total) => `Blog — Página ${page} de ${total}`,
    description: (page) =>
      `Artigos sobre desenvolvimento de software, IA e estratégias de produto — página ${page} do blog da SystemForge.`,
  },
  'it-IT': {
    title: (page, total) => `Blog — Pagina ${page} di ${total}`,
    description: (page) =>
      `Articoli su sviluppo software, IA e strategie di prodotto — pagina ${page} del blog di SystemForge.`,
  },
  en: {
    title: (page, total) => `Blog — Page ${page} of ${total}`,
    description: (page) =>
      `Articles on software development, AI and product strategy — page ${page} of the SystemForge blog.`,
  },
  'es-ES': {
    title: (page, total) => `Blog — Página ${page} de ${total}`,
    description: (page) =>
      `Artículos sobre desarrollo de software, IA y estrategias de producto — página ${page} del blog de SystemForge.`,
  },
}

const meta = PAGINATED_META[getLocale()]

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

  return {
    ...generatePageMetadata({
      title: meta.title(pageNum, totalPages),
      description: meta.description(pageNum),
      path: ROUTES.BLOG_PAGE(pageNum),
    }),
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
    { label: messages.breadcrumb.blog, href: ROUTES.BLOG },
    { label: `${pageLabel} ${pageNum}`, href: '' },
  ]

  const breadcrumbSchemaItems = [
    { label: 'Home', url: config.routes.home },
    { label: 'Blog', url: config.routes.blog },
    { label: `${pageLabel} ${pageNum}`, url: ROUTES.BLOG_PAGE(pageNum) },
  ]

  return (
    <div data-testid={`page-blog-${pageNum}`} className="py-12 md:py-16 bg-background">
      <JsonLdBreadcrumb items={breadcrumbSchemaItems} />
      <Container>
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />

          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Blog — {pageLabel} {pageNum}
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
