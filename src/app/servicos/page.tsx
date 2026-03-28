import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ServiceCard } from '@/components/shared/ServiceCard'
import { CTASection } from '@/components/sections/CTASection'
import { services } from '@/lib/data'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()

export const metadata: Metadata = {
  title: messages.breadcrumb.services,
  description: `${messages.breadcrumb.services} — ${config.siteName}`,
  alternates: { canonical: config.routes.services },
}

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: messages.breadcrumb.services, href: config.routes.services },
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
                {messages.pages.services.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {messages.pages.services.description}
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
