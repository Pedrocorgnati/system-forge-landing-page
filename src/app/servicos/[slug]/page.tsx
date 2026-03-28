import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTASection } from '@/components/sections/CTASection'
import { services } from '@/lib/data'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) return {}
  return {
    title: service.name,
    description: service.longDescription,
    alternates: { canonical: config.routes.service(slug) },
  }
}

export default async function ServicoPage({ params }: Props) {
  const { slug } = await params
  const service = services.find((s) => s.slug === slug)
  if (!service) notFound()

  const breadcrumbs = [
    { label: messages.breadcrumb.home, href: config.routes.home },
    { label: messages.breadcrumb.services, href: config.routes.services },
    { label: service.name, href: config.routes.service(service.slug) },
  ]

  const related = services.filter(
    (s) => s.category === service.category && s.slug !== service.slug,
  ).slice(0, 3)

  return (
    <>
      <div data-testid="page-servico-detalhe" className="py-12 md:py-16 bg-background">
        <Container>
          <div className="flex flex-col gap-8 max-w-3xl">
            <Breadcrumb items={breadcrumbs} />

            <Link
              href={config.routes.services}
              data-testid="servico-back-link"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md w-fit"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {messages.pages.services.backToAll}
            </Link>

            <div className="flex flex-col gap-4">
              <span className="text-5xl leading-none" role="img" aria-label={service.name}>
                {service.icon}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                {service.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {service.longDescription}
              </p>
            </div>

            {related.length > 0 && (
              <div className="flex flex-col gap-4 pt-8 border-t border-border">
                <h2 className="font-semibold text-foreground">{messages.pages.services.relatedTitle}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {related.map((s) => (
                    <Link
                      key={s.slug}
                      href={config.routes.service(s.slug)}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                    >
                      <span className="text-2xl" role="img" aria-label={s.name}>{s.icon}</span>
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>
      <CTASection />
    </>
  )
}
