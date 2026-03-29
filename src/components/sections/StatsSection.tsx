'use client'

import React from 'react'
import { Container } from '@/components/ui/Container'
import { useCounter } from '@/hooks/useCounter'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { loadMessages } from '@config/content'

const messages = loadMessages()

const stats = [
  { target: 50, suffix: '+', label: 'Projetos entregues', sub: 'de todo tipo e tamanho' },
  { target: 100, suffix: '%', label: 'Satisfação dos clientes', sub: 'avaliação média 5 estrelas' },
  { target: 5, suffix: '', label: 'Anos de experiência', sub: 'em software sob medida' },
  { target: 2, suffix: 'h', label: 'Tempo de resposta', sub: 'para qualquer demanda' },
]

function StatItem({ stat, active }: { stat: (typeof stats)[number]; active: boolean }) {
  const count = useCounter(stat.target, active)
  return (
    <div className="flex flex-col items-center gap-2 text-center py-8 px-4">
      <dt
        className="text-[52px] sm:text-[64px] font-bold text-primary tabular-nums leading-none tracking-tight"
        aria-live="polite"
        aria-label={`${stat.target}${stat.suffix} ${stat.label}`}
      >
        {count}{stat.suffix}
      </dt>
      <dd className="flex flex-col gap-0.5">
        <span className="text-base font-semibold text-foreground">{stat.label}</span>
        <span className="text-xs text-muted-foreground">{stat.sub}</span>
      </dd>
    </div>
  )
}

export function StatsSection() {
  const { ref, hasIntersected: active } = useIntersectionObserver({ threshold: 0.3 })

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      data-testid="section-stats"
      aria-label={messages.sections.stats.ariaLabel}
      className="w-full bg-card border-y border-border py-4 md:py-0"
    >
      <Container>
        <dl className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} active={active} />
          ))}
        </dl>
      </Container>
    </section>
  )
}
