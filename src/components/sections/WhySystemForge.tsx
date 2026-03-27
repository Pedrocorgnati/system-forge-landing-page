'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, SearchCheck, Blocks, Zap, ShieldCheck, Headphones } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/utils'

const reasons: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: FileText,
    title: 'Documentação primeiro',
    description:
      'Todo projeto começa com documentação completa — PRD, wireframes e especificações antes de escrever uma linha de código.',
  },
  {
    Icon: SearchCheck,
    title: 'Transparência total',
    description:
      'Acesso em tempo real ao código, repositório, tarefas e relatórios de progresso durante todo o desenvolvimento.',
  },
  {
    Icon: Blocks,
    title: 'Arquitetura sólida',
    description:
      'Código limpo, testado e documentado. Entregamos sistemas que sua equipe consegue manter e evoluir.',
  },
  {
    Icon: Zap,
    title: 'Entrega rápida',
    description:
      'Sprints curtos com entregas incrementais. Você vê resultados reais em semanas, não meses.',
  },
  {
    Icon: ShieldCheck,
    title: 'Código é seu',
    description:
      'Zero lock-in. Todo o código-fonte, infraestrutura e dados ficam com você. Sem dependências indesejadas.',
  },
  {
    Icon: Headphones,
    title: 'Suporte pós-entrega',
    description:
      'Não sumimos após o deploy. Acompanhamos o lançamento e oferecemos suporte técnico dedicado.',
  },
]

const metrics = [
  { target: 50, suffix: '+', label: 'Projetos entregues' },
  { target: 100, suffix: '%', label: 'Satisfação dos clientes' },
  { target: 5, suffix: '', label: 'Anos de experiência' },
  { target: 2, suffix: 'h', label: 'Tempo de resposta' },
]

const pipelineSteps = ['PRD', 'WIRE', 'DEV']

function useCounter(target: number, active: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setCount(target))
      return () => cancelAnimationFrame(id)
    }
    const duration = target >= 50 ? 1400 : 1000
    let rafId = 0
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        rafId = requestAnimationFrame((t) => step(t, startTime))
      }
    }
    rafId = requestAnimationFrame((t) => step(t, t))
    return () => cancelAnimationFrame(rafId)
  }, [active, target])

  return count
}

function MetricCounter({
  metric,
  active,
  index,
}: {
  metric: (typeof metrics)[number]
  active: boolean
  index: number
}) {
  const count = useCounter(metric.target, active)
  return (
    <div
      className={cn(
        'why-reveal flex flex-col items-center gap-1.5 text-center',
        index > 0 && 'border-t border-border pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8 lg:pl-10',
      )}
      data-reveal
      data-delay={String(index * 80)}
    >
      {/* Visible animated number — hidden from SR during animation */}
      <dt
        className="text-5xl sm:text-[64px] font-bold tracking-tight tabular-nums text-primary leading-none"
        aria-hidden="true"
      >
        {count}
        {metric.suffix}
      </dt>
      {/* Static accessible label announces only the final value */}
      <span className="sr-only">
        {metric.target}
        {metric.suffix} {metric.label}
      </span>
      <dd className="text-sm text-muted-foreground" aria-hidden="true">
        {metric.label}
      </dd>
    </div>
  )
}

export function WhySystemForge() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [countersActive, setCountersActive] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    // Reveal cards + header
    const revealEls = el.querySelectorAll('[data-reveal]')
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true')
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    revealEls.forEach((node) => revealObserver.observe(node))

    // Counters
    const metricsEl = el.querySelector('[data-testid="why-metrics"]')
    const counterObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersActive(true)
          counterObserver.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    if (metricsEl) counterObserver.observe(metricsEl)

    return () => {
      revealObserver.disconnect()
      counterObserver.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      data-testid="section-why"
      aria-label="Por que escolher a SystemForge"
      className="relative w-full overflow-hidden bg-background py-20 md:py-28"
    >
      {/* Separador superior */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden="true"
      />

      {/* Background radial blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Container>
        <div className="flex flex-col gap-14 md:gap-16">

          {/* Header */}
          <div
            data-reveal
            data-delay="0"
            className="why-reveal flex flex-col gap-4 max-w-2xl lg:flex-row lg:items-start lg:justify-between lg:max-w-none"
          >
            {/* Texto */}
            <div className="flex flex-col gap-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                  Por que a SystemForge
                </span>
              </div>
              <h2 className="text-[32px] sm:text-[40px] font-semibold text-foreground leading-tight">
                Não somos mais uma{' '}
                <span className="text-muted-foreground">agência de software</span>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Processo claro, documentação rigorosa e comprometimento real com o sucesso do seu projeto.
              </p>
            </div>

            {/* Pipeline decoration — desktop only */}
            <div
              className="hidden lg:flex items-center gap-1.5 self-start mt-2 shrink-0"
              aria-hidden="true"
            >
              {pipelineSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className="rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground">
                    {step}
                  </span>
                  {i < pipelineSteps.length - 1 && (
                    <span className="text-xs text-primary/40 select-none">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reasons grid */}
          <div
            data-testid="why-reasons-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {reasons.map((reason, index) => {
              const { Icon } = reason
              return (
                <div
                  key={reason.title}
                  data-reveal
                  data-delay={String(index * 80)}
                  className={cn(
                    'why-reveal group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6',
                    'shadow-[0_2px_8px_rgba(2,62,88,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
                    'hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_12px_32px_rgba(37,99,235,0.12)]',
                    'transition-all duration-200 ease-out',
                  )}
                >
                  {/* Icon badge */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 ease-out group-hover:bg-primary/15 group-hover:shadow-[0_4px_16px_rgba(37,99,235,0.2)]">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-foreground leading-snug">{reason.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {reason.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Metrics — Confidence Panel */}
          <div
            data-testid="why-metrics"
            className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 sm:px-10"
          >
            {/* Halo central */}
            <div
              className="pointer-events-none absolute inset-0 m-auto h-40 w-40 sm:h-64 sm:w-64 rounded-full bg-primary/8 blur-3xl"
              aria-hidden="true"
            />

            <dl className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
              {metrics.map((metric, index) => (
                <MetricCounter
                  key={metric.label}
                  metric={metric}
                  active={countersActive}
                  index={index}
                />
              ))}
            </dl>
          </div>

        </div>
      </Container>
    </section>
  )
}
