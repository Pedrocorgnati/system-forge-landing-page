'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { CTAButton } from '@/components/ui/CTAButton'
import { buildWhatsAppCTA } from '@/lib/cta'

const benefits = [
  'Análise de viabilidade técnica em segundos',
  'Recomendações de stack personalizadas',
  'Estimativa de investimento realista',
  'Roadmap sugerido com milestones',
]

export function StrategicAdvisorTeaser() {
  const whatsappCTA = buildWhatsAppCTA('Falar com a equipe', 'advisor-teaser')

  return (
    <section
      data-testid="section-advisor-teaser"
      aria-label="Conselheiro de IA — em breve"
      className="w-full bg-background py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-8 max-w-2xl mx-auto items-center text-center">
          <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            Em breve
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Conselheiro de IA
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Descreva seu projeto e receba em segundos uma análise completa com
              recomendações de tecnologia, estimativa de investimento e roadmap sugerido.
            </p>
          </div>

          {/* Benefits list */}
          <ul className="flex flex-col gap-3 text-left w-full max-w-md">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-success mt-0.5 shrink-0" aria-hidden="true">✓</span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* Coming soon card */}
          <div className="flex flex-col items-center gap-6 py-12 px-8 rounded-2xl border border-border border-dashed bg-surface w-full">
            <div
              className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl"
              aria-hidden="true"
            >
              🤖
            </div>
            <div className="flex flex-col gap-2 text-center">
              <h3 className="text-xl font-semibold text-foreground">Ferramenta em desenvolvimento</h3>
              <p className="text-muted-foreground max-w-xs">
                O Conselheiro de IA estará disponível em breve. Enquanto isso, fale
                diretamente com nossa equipe para uma análise personalizada.
              </p>
            </div>
            <CTAButton config={whatsappCTA} variant="primary" size="md" />
          </div>

          {/* Back to home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar para home
          </Link>
        </div>
      </Container>
    </section>
  )
}
