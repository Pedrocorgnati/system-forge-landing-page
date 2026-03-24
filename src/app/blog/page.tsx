import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SITE, ROUTES } from '@/lib/constants'

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

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-border border-dashed bg-surface">
            <div
              className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl"
              aria-hidden="true"
            >
              ✍️
            </div>
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                Artigos chegando em breve
              </h2>
              <p className="text-muted-foreground max-w-sm">
                Estamos preparando conteúdo de qualidade sobre desenvolvimento de software,
                IA e estratégias de produto. Em breve por aqui!
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
