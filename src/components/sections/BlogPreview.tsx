import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { ROUTES } from '@/lib/constants'

export function BlogPreview() {
  return (
    <section
      data-testid="section-blog"
      aria-label="Blog"
      className="w-full bg-surface py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                Blog
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Conteúdo sobre tecnologia e negócios
              </h2>
            </div>
            <Link
              href={ROUTES.blog}
              data-testid="blog-view-all-link"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md"
            >
              Ver todos os artigos
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Empty state */}
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
        </div>
      </Container>
    </section>
  )
}
