'use client'

import { useEffect, useRef } from 'react'
import { Search, Zap, TrendingUp } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { buildWhatsAppCTA } from '@/lib/cta'
import { CTAButton } from '@/components/ui/CTAButton'

const steps = [
  {
    number: '01',
    title: 'Diagnóstico e estratégia',
    description:
      'Mapeamos seu negócio, objetivos e processos atuais. Entregamos um roadmap de produto priorizado por ROI antes de escrever uma linha de código.',
    tags: ['Discovery', 'PRD', 'Wireframes'],
    Icon: Search,
  },
  {
    number: '02',
    title: 'Construção ágil',
    description:
      'Squad sênior dedicado ao seu projeto. Sprints quinzenais com entregas validadas — você acompanha o progresso em tempo real via repositório e dashboard.',
    tags: ['Sprints', 'Code Review', 'CI/CD'],
    Icon: Zap,
  },
  {
    number: '03',
    title: 'Escala e evolução',
    description:
      'Monitoramos, otimizamos e expandimos features com dados reais de uso. Suporte técnico dedicado e código 100% seu — sem lock-in.',
    tags: ['Monitoramento', 'Iteração', 'Suporte'],
    Icon: TrendingUp,
  },
]

export function ProcessSection() {
  const cta = buildWhatsAppCTA('Vamos começar', 'projeto de software')
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const elements = sectionRef.current?.querySelectorAll('[data-reveal]')
    if (!elements?.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="processo"
      data-testid="section-process"
      aria-label="Como trabalhamos"
      className="relative w-full overflow-hidden bg-surface py-20 md:py-28"
    >
      {/* Background radial blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Container>
        <div className="flex flex-col gap-16">
          {/* Header — MC-06: eyebrow com linha + MC-05: reveal */}
          <div
            data-reveal
            data-delay="0"
            className="process-reveal flex flex-col gap-4 max-w-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                Como trabalhamos
              </span>
            </div>
            <h2 className="text-[32px] sm:text-[40px] font-semibold text-foreground leading-tight">
              Do briefing ao lançamento —{' '}
              <span className="text-muted-foreground">sem surpresas</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Processo estruturado e transparente. Você sabe exatamente o que está sendo construído
              e por quê, em cada etapa do projeto.
            </p>
          </div>

          {/* Steps — MC-01: grid 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => {
              const { Icon } = step
              return (
                <div
                  key={step.number}
                  data-reveal
                  data-delay={String(index * 120)}
                  className="process-reveal group relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)]"
                >
                  {/* MC-03: Watermark number */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-4 top-3 select-none font-black leading-none text-foreground/[0.04]"
                    style={{ fontSize: '5rem' }}
                  >
                    {step.number}
                  </span>

                  {/* MC-03: Icon badge + step label */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 ease-out group-hover:bg-primary/15 group-hover:shadow-[0_4px_16px_rgba(37,99,235,0.2)]">
                      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/60">
                      Passo {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-3">
                    <h3 className="text-lg font-semibold leading-snug text-foreground">
                      {step.title}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* MC-07: Tags com group-hover shift */}
                  <div className="flex flex-wrap gap-2">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md border border-border bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground transition-colors duration-300 ease-out group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA — MC-05: reveal com delay 360ms */}
          <div
            data-reveal
            data-delay="360"
            className="process-reveal flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center"
          >
            <CTAButton config={cta} size="lg" variant="primary" />
            <p className="text-sm text-muted-foreground">
              ✓ Orçamento gratuito &nbsp;·&nbsp; ✓ Resposta em até 2h
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
