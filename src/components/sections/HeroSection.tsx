import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { getSiteConfig } from '@config'
import { loadMessages, loadPageMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()
const pageMessages = loadPageMessages()

const locale = config.locale
const kpiData = [
  {
    value: '50+',
    label: locale === 'it-IT' ? 'Progetti' : locale === 'en' ? 'Projects' : 'Projetos',
    bg: 'bg-primary/5',
    color: 'text-primary',
  },
  {
    value: '100%',
    label: locale === 'it-IT' ? 'Nei tempi' : locale === 'en' ? 'On time' : 'No prazo',
    bg: 'bg-success/5',
    color: 'text-success',
  },
  {
    value: '24/7',
    label: locale === 'it-IT' ? 'Supporto' : locale === 'en' ? 'Support' : 'Suporte',
    bg: 'bg-info/5',
    color: 'text-info',
  },
]


const clientNames = [
  'TechNova', 'ScaleUp Brasil', 'FinanceHub', 'DataPrime', 'CloudFirst',
  'InnovateCo', 'GrowthLabs', 'SmartRetail', 'HealthTech BR', 'EduPlatform',
]
const clientNamesDoubled = [...clientNames, ...clientNames]


export function HeroSection() {
  return (
    <section
      data-testid="section-hero"
      aria-label={messages.sections.hero.ariaLabel}
      className="relative w-full overflow-hidden bg-background"
    >
      {/* Dot grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10 hero-dot-grid" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-3xl -translate-x-1/3 translate-y-1/4" />
      </div>

      <Container>
        <div className="py-20 md:py-28 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column — content */}
          <div className="flex flex-col gap-6 max-w-xl">
            {/* Badge */}
            <div className="hero-enter hero-delay-0 inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
              <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
              {messages.pages.hero.badge}
            </div>

            {/* Headline */}
            <h1
              data-testid="hero-headline"
              className="hero-enter hero-delay-100 text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              {pageMessages.hero.titulo}
            </h1>

            {/* Subheadline */}
            <p className="hero-enter hero-delay-200 text-lg text-muted-foreground leading-relaxed">
              {pageMessages.hero.subtitulo}
            </p>

            {/* CTAs */}
            <div className="hero-enter hero-delay-300 flex flex-wrap items-center gap-3">
              <Link
                href={config.routes.portfolio}
                className="group inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-lg"
              >
                {messages.cta.portfolio}
                <ArrowRight size={16} className="ml-0.5 transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>

            {/* Mobile KPI strip */}
            <div className="hero-enter hero-delay-300 flex gap-3 lg:hidden">
              {kpiData.map((kpi) => (
                <div key={kpi.label} className={`flex-1 rounded-xl p-3 ${kpi.bg} border border-foreground/5`}>
                  <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <p className="hero-enter hero-delay-300 text-sm text-muted-foreground">
              {locale === 'it-IT'
                ? '✓ Senza vincoli \u00a0\u00a0 ✓ Preventivo gratuito \u00a0\u00a0 ✓ Risposta entro 2h'
                : locale === 'en'
                ? '✓ No lock-in \u00a0\u00a0 ✓ Free estimate \u00a0\u00a0 ✓ Response within 2h'
                : '✓ Sem fidelidade \u00a0\u00a0 ✓ Orçamento gratuito \u00a0\u00a0 ✓ Resposta em até 2h'}
            </p>
          </div>

          {/* Right column — hero illustration. Container reserva aspect-ratio
              square e width maxima para travar CLS antes do <img> carregar.
              sizes informa ao browser a largura efetiva do recurso por viewport,
              cortando bandwidth desperdiçada em mobile. priority + fetchPriority
              high mantem o LCP candidate do hero direito sob 2.5s. */}
          <div className="hidden lg:flex items-center justify-center hero-enter-scale hero-delay-300">
            <div className="w-full max-w-[480px] aspect-square">
              <Image
                src="/hero-illustration.webp"
                alt={locale === 'it-IT' ? 'Illustrazione SystemForge - software su misura'
                  : locale === 'en' ? 'SystemForge illustration - custom software'
                  : 'Ilustração SystemForge - software sob medida'}
                width={1254}
                height={1254}
                sizes="(min-width: 1024px) 480px, 0px"
                className="w-full h-auto"
                priority
                fetchPriority="high"
              />
            </div>
          </div>
        </div>

        {/* Client names marquee */}
        <div className="hero-enter hero-delay-400 border-t border-border pb-12 pt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4 text-center">
            {locale === 'it-IT' ? 'Aziende che hanno già cresciuto'
              : locale === 'en' ? 'Companies that have already grown'
              : 'Empresas que já cresceram'}
          </p>
          <div
            className="relative overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
            }}
          >
            <div className="flex gap-8 animate-marquee-hero" aria-hidden="true">
              {clientNamesDoubled.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 text-sm font-medium text-muted-foreground/50 whitespace-nowrap"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
