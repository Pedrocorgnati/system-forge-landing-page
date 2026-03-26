import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTAGroup } from '@/components/ui/CTAGroup'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { RelatedProjects } from '@/components/sections/RelatedProjects'
import { RelatedArticles } from '@/components/sections/RelatedArticles'
import { buildWhatsAppCTA, buildBudgetCTA } from '@/lib/cta'
import type { ServicePageData, ArticleFrontmatter } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

interface ServicePageProps {
  config: ServicePageData
  relatedArticles: ArticleFrontmatter[]
}

/**
 * ServicePage — componente completo da página de serviço.
 * Server Component: sem 'use client'.
 * INT-067, INT-068: Página individual de serviço com 5 seções.
 */
export function ServicePage({ config, relatedArticles }: ServicePageProps) {
  const breadcrumbItems = [
    { label: 'Serviços', href: ROUTES.SERVICES },
    { label: config.title, href: ROUTES.SERVICE(config.category) },
  ]

  function buildServiceCTAs(zone: 'hero' | 'bottom') {
    return [
      buildWhatsAppCTA('Falar no WhatsApp', `service-${zone}-${config.category}`),
      buildBudgetCTA('Calcular orçamento grátis', `service-${zone}-${config.category}`),
    ]
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <Container>
          <div className="py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </Container>
      </div>

      {/* Seção 1: Hero */}
      <Section id={`servico-${config.category}`}>
        <Container>
          <div className="flex flex-col gap-6 max-w-3xl py-12 md:py-20">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary w-fit uppercase tracking-wide">
              {config.category}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
              {config.title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {config.longDescription}
            </p>

            <CTAGroup
              configs={buildServiceCTAs('hero')}
              layout="horizontal"
              size="lg"
            />
          </div>
        </Container>
      </Section>

      {/* Seção 2: Projetos Relacionados */}
      <RelatedProjects
        projects={config.relatedProjects}
        serviceName={config.title}
      />

      {/* Seção 3: Artigos Relacionados */}
      <RelatedArticles
        articles={relatedArticles}
        serviceName={config.title}
        serviceSlug={config.category}
      />

      {/* Seção 4: CTA secundário */}
      <Section id={`cta-${config.category}`}>
        <Container>
          <div className="flex flex-col items-center gap-6 text-center py-8 md:py-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Fale com a equipe SystemForge e descubra como podemos acelerar o seu projeto.
            </p>
            <CTAGroup
              configs={buildServiceCTAs('bottom')}
              layout="horizontal"
              size="md"
            />
          </div>
        </Container>
      </Section>
    </>
  )
}
