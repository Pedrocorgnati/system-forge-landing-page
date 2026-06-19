import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { JsonLdBreadcrumb } from '@/components/seo/JsonLdBreadcrumb'
import { JsonLdService } from '@/components/seo/JsonLdService'
import { CTASection } from '@/components/sections/CTASection'
import { services, allServiceSlugs, getServiceBySlug } from '@/lib/data'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()

export function generateStaticParams() {
  return allServiceSlugs.map((slug) => ({ slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}

  const { generatePageMetadata } = await import('@/lib/seo')
  return generatePageMetadata({
    title: service.name,
    description: service.longDescription,
    // Canonicaliza aliases para o slug canônico (evita conteúdo duplicado no SEO).
    path: config.routes.service(service.slug),
  })
}

export default async function ServicoPage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
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
      <JsonLdBreadcrumb
        items={breadcrumbs.map(b => ({ label: b.label, url: b.href }))}
      />
      <JsonLdService
        name={service.name}
        description={service.longDescription}
        provider={{ name: config.siteName, url: config.url }}
        areaServed={["BR", "IT", "US"]}
        url={`${config.url}${config.routes.service(slug)}`}
        priceRange="Variable"
      />
      <div data-testid="page-servico-detalhe" className="py-12 md:py-16 bg-background">
        <Container>
          <div className="flex flex-col gap-10 max-w-4xl">
            <Breadcrumb items={breadcrumbs} />

            <Link
              href={config.routes.services}
              data-testid="servico-back-link"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md w-fit"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {messages.pages.services.backToAll}
            </Link>

            {/* Hero */}
            <div className="flex flex-col gap-4">
              <span className="text-5xl leading-none" role="img" aria-label={service.name}>
                {service.icon}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                {service.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {service.longDescription}
              </p>
            </div>

            {/* Benefits */}
            {service.benefits && service.benefits.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-foreground">{messages.pages.services.benefitsTitle}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.benefits.map((b, i) => (
                    <div key={i} className="flex gap-4 p-5 rounded-xl border border-border bg-card">
                      <span className="text-2xl shrink-0" role="img" aria-hidden="true">{b.icon}</span>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{b.title}</span>
                        <span className="text-sm text-muted-foreground">{b.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process */}
            {service.process && service.process.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-foreground">{messages.pages.services.processTitle}</h2>
                <div className="flex flex-col gap-3">
                  {service.process.map((step) => (
                    <div key={step.step} className="flex gap-4 p-5 rounded-xl border border-border bg-card">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {step.step}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{step.title}</span>
                        <span className="text-sm text-muted-foreground">{step.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Use Cases */}
            {service.useCases && service.useCases.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-foreground">{messages.pages.services.useCasesTitle}</h2>
                <ul className="flex flex-col gap-2">
                  {service.useCases.map((uc, i) => (
                    <li key={i} className="flex gap-3 text-muted-foreground">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* FAQ */}
            {service.faq && service.faq.length > 0 && (
              <div className="flex flex-col gap-4 pt-2 border-t border-border">
                <h2 className="text-2xl font-bold text-foreground">{messages.pages.services.faqTitle}</h2>
                <div className="flex flex-col gap-4">
                  {service.faq.map((item, i) => (
                    <div key={i} className="flex flex-col gap-2 p-5 rounded-xl border border-border bg-card">
                      <span className="font-semibold text-foreground">{item.q}</span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{item.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related */}
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
