'use client'

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { CTAButton } from '@/components/ui/CTAButton'
import { buildDefaultCTAs } from '@/lib/cta'

const trustSignals = [
  { text: 'Orçamento gratuito', icon: Check },
  { text: 'Resposta em até 2h', icon: Check },
  { text: 'Contrato claro', icon: Check },
  { text: 'Código seu, sem lock-in', icon: Check },
]

export function CTASection() {
  const ctas = buildDefaultCTAs('desenvolvimento de software sob medida')
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-visible', 'true')
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-testid="section-cta"
      aria-label="Fale com a SystemForge"
      className="relative w-full overflow-hidden bg-[#0C1120] py-20 md:py-28"
    >
      {/* Gradient transition from light to dark */}
      <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-background to-[#0C1120] pointer-events-none" aria-hidden="true" />

      {/* Background layers */}
      <div className="cta-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="cta-grid-overlay pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      {/* Floating glow orbs — desktop only */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        <div className="absolute top-12 right-16 w-[200px] h-[200px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-8 left-12 w-[160px] h-[160px] rounded-full bg-blue-400/8 blur-[80px]" />
      </div>

      {/* Radial central glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/[0.06] blur-[120px]" />
      </div>

      <Container>
        <div className="relative z-10 flex flex-col items-center gap-10 text-center">
          {/* Eyebrow */}
          <span className="cta-stagger-1 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/40">
            Próximo passo
          </span>

          {/* Headline */}
          <h2 className="cta-stagger-2 text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-white leading-[1.15] max-w-2xl">
            Pronto para transformar sua ideia em software?
          </h2>

          {/* Description */}
          <p className="cta-stagger-3 text-white/80 text-lg leading-relaxed max-w-xl">
            Fale com a gente agora. Sem enrolação — analisamos seu projeto e
            apresentamos uma proposta em até 24 horas.
          </p>

          {/* CTA Button */}
          <div className="cta-stagger-4">
            <CTAButton
              config={ctas[0]}
              size="lg"
              variant="primary"
              className="bg-white !text-[#0C1120] cta-btn-glow shadow-[0_8px_25px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_35px_rgba(37,99,235,0.5)] hover:-translate-y-px active:translate-y-0 transition-all duration-200"
            />
          </div>

          {/* Trust signals as glassmorphic pills */}
          <div className="cta-stagger-5 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl w-full">
            {trustSignals.map((signal) => (
              <div
                key={signal.text}
                className="cta-card-shine flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:-translate-y-0.5 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
              >
                <signal.icon size={14} className="shrink-0 text-blue-400" aria-hidden="true" />
                <span className="text-xs font-medium text-white/70">{signal.text}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
