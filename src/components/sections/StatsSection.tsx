'use client'

import { useEffect, useRef, useState } from 'react'
import { Container } from '@/components/ui/Container'

const stats = [
  { target: 50, suffix: '+', label: 'Projetos entregues', sub: 'de todo tipo e tamanho' },
  { target: 100, suffix: '%', label: 'Satisfação dos clientes', sub: 'avaliação média 5 estrelas' },
  { target: 5, suffix: '', label: 'Anos de experiência', sub: 'em software sob medida' },
  { target: 2, suffix: 'h', label: 'Tempo de resposta', sub: 'para qualquer demanda' },
]

function useCounter(target: number, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }
    const duration = 1400
    let rafId: number
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) rafId = requestAnimationFrame((t) => step(t, startTime))
    }
    rafId = requestAnimationFrame((t) => step(t, t))
    return () => cancelAnimationFrame(rafId)
  }, [active, target])
  return count
}

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
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      data-testid="section-stats"
      aria-label="Números da SystemForge"
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
