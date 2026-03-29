import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Container } from '@/components/ui/Container'
import { MDXContent } from '@/components/blog/MDXContent'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { CTAContextual } from '@/components/blog/CTAContextual'
import { SidebarCTA } from '@/components/blog/SidebarCTA'
import { ArticleCard } from '@/components/blog/ArticleCard'
import { NewsletterOptIn } from '@/components/ui/NewsletterOptIn'
import { ServiceCategory, type ArticleFrontmatter } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { loadMessages } from '@config/content'

/**
 * ArticlePage — layout completo de artigo individual.
 *
 * 8 seções: breadcrumb, header, conteúdo MDX, CTAContextual,
 * artigos relacionados, newsletter placeholder, sidebar (desktop).
 *
 * INT-006: Jornada artigo → CTA → conversão.
 * FEAT-BL-005: Artigos relacionados (3 cards).
 */

interface Article {
  title: string
  slug: string
  date: string
  description: string
  tags: string[]
  coverImage: string
  author: string
  relatedService?: ServiceCategory
  readingTime: number
  content: string
}

interface ArticlePageProps {
  article: Article
  relatedArticles: ArticleFrontmatter[]
}


export function ArticlePage({ article, relatedArticles }: ArticlePageProps) {
  const m = loadMessages()
  const breadcrumbItems = [
    { label: 'Blog', href: ROUTES.BLOG },
    {
      label: article.title.length > 40 ? article.title.slice(0, 40) + '...' : article.title,
      href: ROUTES.BLOG_POST(article.slug),
    },
  ]

  return (
    <div data-testid="article-page" className="py-8 md:py-12 bg-background">
      <Container>
        {/* 1. Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Layout: conteúdo principal + sidebar (desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">

          {/* Coluna principal */}
          <article>
            {/* SidebarCTA mobile (before content on mobile) */}
            <div className="lg:hidden mb-6">
              <SidebarCTA relatedService={article.relatedService} />
            </div>

            {/* 2. Header do artigo */}
            <header data-testid="article-page-header" className="mb-8">
              {/* Cover image */}
              <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                <OptimizedImage
                  src={article.coverImage || '/images/blog/default-cover.png'}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.slice(0, 3).map(tag => (
                  <Link
                    key={tag}
                    href={ROUTES.BLOG_TAG(tag)}
                    className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Título */}
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
                {article.title}
              </h1>

              {/* Meta: autor, data, tempo de leitura */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{article.author}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={article.date}>{formatDate(article.date)}</time>
                <span aria-hidden="true">·</span>
                <span>{article.readingTime} {m.blog.readingTime}</span>
              </div>
            </header>

            {/* 3. Conteúdo MDX */}
            <div
              data-testid="article-page-content"
              className="prose prose-lg max-w-none
                prose-headings:text-foreground
                prose-p:text-muted-foreground
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-code:text-foreground prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded
                prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border
                prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground
                prose-strong:text-foreground
                prose-img:rounded-lg"
            >
              <MDXContent code={article.content} />
            </div>

            {/* 4. CTAContextual */}
            <CTAContextual relatedService={article.relatedService} />

            {/* 5. Artigos relacionados */}
            <section data-testid="article-page-related" className="mt-10" aria-labelledby="related-articles-heading">
              <h2 id="related-articles-heading" className="text-xl font-bold text-foreground mb-4">
                {m.blog.relatedArticles}
              </h2>
              {relatedArticles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {relatedArticles.slice(0, 3).map(relArt => (
                    <ArticleCard key={relArt.slug} article={relArt} variant="compact" />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  <Link href={ROUTES.BLOG} className="text-primary hover:underline">
                    {m.blog.viewMoreArticles}
                  </Link>
                </p>
              )}
            </section>

            {/* 6. NewsletterOptIn — module-8/TASK-1 */}
            <NewsletterOptIn />
          </article>

          {/* Sidebar desktop (sticky) */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <SidebarCTA relatedService={article.relatedService} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
