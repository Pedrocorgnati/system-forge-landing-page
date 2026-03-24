'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/ui/Container'
import { cn } from '@/lib/utils'

const reasons = [
  {
    icon: '📄',
    title: 'Documentação primeiro',
    description:
      'Todo projeto começa com documentação completa — PRD, wireframes e especificações antes de escrever uma linha de código.',
  },
  {
    icon: '🔍',
    title: 'Transparência total',
    description:
      'Acesso em tempo real ao código, repositório, tarefas e relatórios de progresso durante todo o desenvolvimento.',
  },
  {
    icon: '🏗️',
    title: 'Arquitetura sólida',
    description:
      'Código limpo, testado e documentado. Entregamos sistemas que sua equipe consegue manter e evoluir.',
  },
  {
    icon: '⚡',
    title: 'Entrega rápida',
    description:
      'Sprints curtos com entregas incrementais. Você vê resultados reais em semanas, não meses.',
  },
  {
    icon: '🔒',
    title: 'Código é seu',
    description:
      'Zero lock-in. Todo o código-fonte, infraestrutura e dados ficam com você. Sem dependências indesejadas.',
  },
  {
    icon: '🤝',
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

function useCounter(target: number, active: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }
    let start = 0
    const duration = 1200
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        requestAnimationFrame((t) => step(t, startTime))
      }
    }
    requestAnimationFrame((t) => step(t, t))
    return () => setCount(target)
  }, [active, target])

  return count
}

function MetricCounter({
  metric,
  active,
}: {
  metric: (typeof metrics)[number]
  active: boolean
}) {
  const count = useCounter(metric.target, active)
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <dt
        className="text-4xl font-bold text-primary tabular-nums"
        aria-live="polite"
        aria-label={`${metric.target}${metric.suffix} ${metric.label}`}
      >
        {count}
        {metric.suffix}
      </dt>
      <dd className="text-sm text-muted-foreground">{metric.label}</dd>
    </div>
  )
}

export function WhySystemForge() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [countersActive, setCountersActive] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-testid="section-why"
      aria-label="Por que escolher a SystemForge"
      className="w-full bg-background py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-12">
          {/* Header */}
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Por que a SystemForge
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Não somos mais uma agência de software
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Somos uma software house com processo claro, documentação rigorosa e
              comprometimento real com o sucesso do seu projeto.
            </p>
          </div>

          {/* Reasons grid */}
          <div data-testid="why-reasons-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className={cn(
                  'flex flex-col gap-3 p-6 rounded-xl border border-border bg-card',
                  'hover:border-primary/30 transition-colors duration-200',
                )}
              >
                <span className="text-2xl leading-none" role="img" aria-label={reason.title}>
                  {reason.icon}
                </span>
                <h3 className="font-semibold text-foreground">{reason.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div data-testid="why-metrics" className="bg-surface rounded-2xl border border-border p-8">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric) => (
                <MetricCounter key={metric.label} metric={metric} active={countersActive} />
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  )
}
