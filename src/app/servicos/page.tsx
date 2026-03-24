import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServiceCard } from '@/components/shared/ServiceCard'
import { CTASection } from '@/components/sections/CTASection'
import { services } from '@/lib/data'
import { SITE, ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Serviços',
  description: `Conheça os serviços de desenvolvimento de software da ${SITE.name}: SaaS, mobile, landing pages, e-commerce, dashboards, APIs, automação com IA e muito mais.`,
  alternates: { canonical: '/servicos' },
}

const breadcrumbs = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Serviços', href: ROUTES.servicos },
]

export default function ServicosPage() {
  return (
    <>
      <div data-testid="page-servicos" className="py-12 md:py-16 bg-background">
        <Container>
          <div className="flex flex-col gap-8">
            <Breadcrumb items={breadcrumbs} />

            <div className="flex flex-col gap-3 max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                Nossos serviços
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Do MVP ao produto escalável — soluções de software sob medida para cada
                etapa do seu negócio. Trabalhamos com as stacks mais modernas do mercado.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <ServiceCard key={service.slug} service={service} />
              ))}
            </div>
          </div>
        </Container>
      </div>
      <CTASection />
    </>
  )
}
