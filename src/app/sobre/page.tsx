import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTASection } from '@/components/sections/CTASection'
import { getSiteConfig, type SupportedLocale } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'

const config = getSiteConfig()
const messages = loadMessages()

/**
 * Copy da página "Sobre" resolvida pelo locale do build (`NEXT_PUBLIC_LOCALE`).
 * O corpo desta página NÃO vive em about.json (que guarda apenas
 * title/description/teamSize/yearsExperience), então a paridade locale é
 * entregue por este Record inline — mesmo padrão de ConversionHero/Footer.
 * `{siteName}` continua interpolado via `config.siteName` (fixo por build).
 */
const brAboutCopy = {
  metaTitle: 'Sobre',
  metaDescription: `Conheça a ${config.siteName} — time especializado em desenvolvimento de software sob medida: SaaS, apps mobile, dashboards e automações com IA.`,
  breadcrumb: 'Sobre',
  h1Prefix: 'Sobre a',
  intro:
    'Desenvolvemos software sob medida para transformar negócios. Nossa especialidade é transformar problemas complexos em sistemas confiáveis — SaaS, apps mobile, dashboards, e-commerce e automações com IA.',
  cards: [
    { title: 'Entrega em semanas', desc: 'MVP funcional em 3 a 12 semanas, dependendo da complexidade.' },
    { title: 'Foco no negócio', desc: 'Soluções construídas para gerar resultado, não só para funcionar.' },
    { title: 'Qualidade garantida', desc: 'Código limpo, testes automatizados e documentação desde o dia 1.' },
  ],
}

const itAboutCopy: typeof brAboutCopy = {
  metaTitle: 'Chi siamo',
  metaDescription: `Scopri ${config.siteName} — team specializzato nello sviluppo di software su misura: SaaS, app mobile, dashboard e automazioni con IA.`,
  breadcrumb: 'Chi siamo',
  h1Prefix: 'Chi siamo —',
  intro:
    'Sviluppiamo software su misura per trasformare il business. La nostra specialità è trasformare problemi complessi in sistemi affidabili — SaaS, app mobile, dashboard, e-commerce e automazioni con IA.',
  cards: [
    { title: 'Consegna in poche settimane', desc: 'MVP funzionante in 3-12 settimane, a seconda della complessità.' },
    { title: 'Focus sul business', desc: 'Soluzioni costruite per generare risultati, non solo per funzionare.' },
    { title: 'Qualità garantita', desc: 'Codice pulito, test automatizzati e documentazione fin dal primo giorno.' },
  ],
}

const enAboutCopy: typeof brAboutCopy = {
  metaTitle: 'About',
  metaDescription: `Meet ${config.siteName} — a team specialized in custom software development: SaaS, mobile apps, dashboards, and AI automation.`,
  breadcrumb: 'About',
  h1Prefix: 'About',
  intro:
    'We build custom software to transform businesses. Our specialty is turning complex problems into reliable systems — SaaS, mobile apps, dashboards, e-commerce, and AI automation.',
  cards: [
    { title: 'Delivery in weeks', desc: 'A working MVP in 3 to 12 weeks, depending on complexity.' },
    { title: 'Business-focused', desc: 'Solutions built to drive results, not just to work.' },
    { title: 'Quality guaranteed', desc: 'Clean code, automated tests, and documentation from day one.' },
  ],
}

const esAboutCopy: typeof brAboutCopy = {
  metaTitle: 'Sobre nosotros',
  metaDescription: `Conoce ${config.siteName} — equipo especializado en desarrollo de software a medida: SaaS, apps móviles, dashboards y automatizaciones con IA.`,
  breadcrumb: 'Sobre nosotros',
  h1Prefix: 'Sobre',
  intro:
    'Desarrollamos software a medida para transformar negocios. Nuestra especialidad es convertir problemas complejos en sistemas fiables — SaaS, apps móviles, dashboards, e-commerce y automatizaciones con IA.',
  cards: [
    { title: 'Entrega en semanas', desc: 'Un MVP funcional en 3 a 12 semanas, según la complejidad.' },
    { title: 'Enfoque en el negocio', desc: 'Soluciones construidas para generar resultados, no solo para funcionar.' },
    { title: 'Calidad garantizada', desc: 'Código limpio, pruebas automatizadas y documentación desde el primer día.' },
  ],
}

const ABOUT_COPY: Record<SupportedLocale, typeof brAboutCopy> = {
  'pt-BR': brAboutCopy,
  'it-IT': itAboutCopy,
  'en': enAboutCopy,
  'es-ES': esAboutCopy,
}

const aboutCopy = ABOUT_COPY[config.locale]
const cardEmojis = ['🚀', '🎯', '🔒'] as const

export const metadata: Metadata = generatePageMetadata({
  title: aboutCopy.metaTitle,
  description: aboutCopy.metaDescription,
  path: '/sobre',
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: aboutCopy.breadcrumb, href: '/sobre' },
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
                {aboutCopy.h1Prefix} {config.siteName}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {aboutCopy.intro}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
              {aboutCopy.cards.map((item, i) => (
                <div key={item.title} className="flex flex-col gap-3 p-6 rounded-2xl border border-border bg-surface">
                  <span className="text-3xl" aria-hidden="true">{cardEmojis[i]}</span>
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
