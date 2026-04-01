import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTASection } from '@/components/sections/CTASection'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'

const config = getSiteConfig()
const messages = loadMessages()

export const metadata: Metadata = generatePageMetadata({
  title: 'Sobre',
  description: `Conheça a ${config.siteName} — time especializado em desenvolvimento de software sob medida: SaaS, apps mobile, dashboards e automações com IA.`,
  path: '/sobre',
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: 'Sobre', href: '/sobre' },
]

export default function SobrePage() {
  return (
    <>
      <div data-testid="page-sobre" className="py-12 md:py-24 bg-background">
        <Container>
          <div className="flex flex-col gap-10">
            <Breadcrumb items={breadcrumbs} />

            <div className="flex flex-col gap-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                Sobre a {config.siteName}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Desenvolvemos software sob medida para transformar negócios. Nossa especialidade é transformar problemas complexos em sistemas confiáveis — SaaS, apps mobile, dashboards, e-commerce e automações com IA.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
              {[
                { emoji: '🚀', title: 'Entrega em semanas', desc: 'MVP funcional em 3 a 12 semanas, dependendo da complexidade.' },
                { emoji: '🎯', title: 'Foco no negócio', desc: 'Soluções construídas para gerar resultado, não só para funcionar.' },
                { emoji: '🔒', title: 'Qualidade garantida', desc: 'Código limpo, testes automatizados e documentação desde o dia 1.' },
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-3 p-6 rounded-2xl border border-border bg-surface">
                  <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
      <CTASection />
    </>
  )
}
