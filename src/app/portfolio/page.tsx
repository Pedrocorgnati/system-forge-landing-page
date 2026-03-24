import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PortfolioGallery } from '@/components/sections/PortfolioGallery'
import { CTASection } from '@/components/sections/CTASection'
import { SITE, ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Portfólio',
  description: `Conheça os projetos desenvolvidos pela ${SITE.name}: SaaS, apps mobile, e-commerce, dashboards, APIs e sistemas com IA.`,
  alternates: { canonical: '/portfolio' },
}

const breadcrumbs = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Portfólio', href: ROUTES.portfolio },
]

export default function PortfolioPage() {
  return (
    <>
      <div data-testid="page-portfolio" className="pt-12 md:pt-16 bg-surface">
        <Container>
          <div className="flex flex-col gap-4 pb-0">
            <Breadcrumb items={breadcrumbs} />
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Portfólio completo
            </h1>
            <p className="text-lg text-muted-foreground">
              Todos os projetos desenvolvidos pela SystemForge, filtráveis por categoria.
            </p>
          </div>
        </Container>
        <PortfolioGallery />
      </div>
      <CTASection />
    </>
  )
}
