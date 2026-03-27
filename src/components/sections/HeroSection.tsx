'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { CTAButton } from '@/components/ui/CTAButton'
import { Container } from '@/components/ui/Container'
import { buildDefaultCTAs, buildWhatsAppCTA } from '@/lib/cta'
import { SITE } from '@/lib/constants'
import { ROUTES } from '@/lib/constants'

const kpiData = [
  { value: '50+', label: 'Projetos', bg: 'bg-primary/5', color: 'text-primary' },
  { value: '100%', label: 'No prazo', bg: 'bg-success/5', color: 'text-success' },
  { value: '24/7', label: 'Suporte', bg: 'bg-info/5', color: 'text-info' },
]


const clientNames = [
  'TechNova', 'ScaleUp Brasil', 'FinanceHub', 'DataPrime', 'CloudFirst',
  'InnovateCo', 'GrowthLabs', 'SmartRetail', 'HealthTech BR', 'EduPlatform',
]
const clientNamesDoubled = [...clientNames, ...clientNames]


export function HeroSection() {
  const ctas = buildDefaultCTAs()
  const primaryCTA = ctas[0]

  return (
    <section
      data-testid="section-hero"
      aria-label="Apresentação SystemForge"
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
              Software House · Curitiba, PR
            </div>

            {/* Headline */}
            <h1
              data-testid="hero-headline"
              className="hero-enter hero-delay-100 text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
            >
              Software sob medida para{' '}
              <span className="headline-gradient">transformar negócios</span>
            </h1>

            {/* Subheadline */}
            <p className="hero-enter hero-delay-200 text-lg text-muted-foreground leading-relaxed">
              Da landing page ao sistema complexo com IA — entregamos software de alta qualidade
              com documentação completa, código limpo e suporte dedicado.
            </p>

            {/* CTAs */}
            <div className="hero-enter hero-delay-300 flex flex-wrap items-center gap-3">
              <CTAButton
                config={primaryCTA}
                size="lg"
                variant="primary"
                className="hover:-translate-y-px active:translate-y-0 shadow-[0_4px_14px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.38)] transition-all duration-200"
              />
              <Link
                href={ROUTES.PORTFOLIO}
                className="group inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-lg"
              >
                Ver cases reais
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
              ✓ Sem fidelidade &nbsp;&nbsp; ✓ Orçamento gratuito &nbsp;&nbsp; ✓ Resposta em até 2h
            </p>
          </div>

          {/* Right column — hero illustration */}
          <div className="hidden lg:flex items-center justify-center hero-enter-scale hero-delay-300">
            <Image
              src="/hero-illustration.png"
              alt="Ilustração SystemForge — software sob medida"
              width={1024}
              height={1024}
              className="w-full max-w-[480px] h-auto"
              priority
            />
          </div>
        </div>

        {/* Client names marquee */}
        <div className="hero-enter hero-delay-400 border-t border-border pb-12 pt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4 text-center">
            Empresas que já cresceram
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
