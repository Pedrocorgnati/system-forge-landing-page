import Link from 'next/link'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import type { ArticleFrontmatter, ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

interface RelatedArticlesProps {
  articles: ArticleFrontmatter[]
  serviceName: string
  serviceSlug: ServiceCategory
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(dateStr))
}

/**
 * RelatedArticles — cards de artigos relacionados ao serviço.
 * Server Component: sem 'use client'.
 * INT-048: Links internos serviço → artigos relacionados.
 */
export function RelatedArticles({ articles, serviceName }: RelatedArticlesProps) {
  return (
    <Section id="artigos-relacionados">
      <Container>
        <div className="flex flex-col gap-6">
          <h2 data-testid="related-articles-heading" className="text-2xl sm:text-3xl font-bold text-foreground">
            Artigos Relacionados
          </h2>

          {articles.length === 0 ? (
            <div data-testid="related-articles-empty" className="text-center py-8 text-muted-foreground">
              <p>Em breve: artigos especializados sobre {serviceName}.</p>
              <p className="mt-2">
                <Link
                  href={ROUTES.BLOG}
                  className="underline hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
                >
                  Ver todos os artigos do blog →
                </Link>
              </p>
            </div>
          ) : (
            <div
              data-testid="related-articles-grid"
              role="list"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {articles.map((article) => (
                <div
                  key={article.slug}
                  data-testid={`related-article-${article.slug}`}
                  role="listitem"
                  className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col gap-1">
                    <Link
                      href={ROUTES.BLOG_POST(article.slug)}
                      aria-label={`Ler artigo: ${article.title}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors leading-snug focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
                    >
                      {article.title}
                    </Link>
                    <time
                      dateTime={article.date}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDate(article.date)}
                    </time>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {article.description.length > 120
                      ? `${article.description.slice(0, 120)}...`
                      : article.description}
                  </p>

                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-accent text-accent-foreground font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
