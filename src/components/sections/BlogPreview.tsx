import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { BlogPreviewCards } from '@/components/blog/BlogPreviewCards'
import { ROUTES } from '@/lib/constants'
import { blog as allArticles } from '@/.velite'
import type { ArticleFrontmatter } from '@/lib/types'

function getLatestArticles(count: number): ArticleFrontmatter[] {
  return [...allArticles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.description,
      date: a.date,
      tags: a.tags ?? [],
      coverImage: a.coverImage,
      author: a.author,
      readingTime: a.readingTime,
    }))
}

export function BlogPreview() {
  const articles = getLatestArticles(3)

  if (articles.length === 0) {
    return (
      <section
        data-testid="section-blog"
        aria-label="Blog"
        className="section-blog w-full bg-surface py-16 md:py-20"
      >
        <Container>
          <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-xl border border-border border-dashed bg-background">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl" aria-hidden="true">
              ✍️
            </div>
            <div className="text-center flex flex-col gap-2">
              <h3 className="font-semibold text-foreground">Artigos chegando em breve</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Estamos preparando conteúdo de qualidade sobre desenvolvimento de software,
                IA e estratégias de produto.
              </p>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section
      data-testid="section-blog"
      aria-label="Blog"
      className="section-blog w-full bg-surface py-20 md:py-28"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-primary w-fit">
                Blog
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-[1.15] tracking-[-0.02em]">
                Conteúdo sobre tecnologia e negócios
              </h2>
            </div>
            <Link
              href={ROUTES.blog}
              data-testid="blog-view-all-link"
              className="group shrink-0 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md"
            >
              Ver todos os artigos
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          {/* Cards grid with stagger reveal */}
          <BlogPreviewCards articles={articles} />
        </div>
      </Container>
    </section>
  )
}
