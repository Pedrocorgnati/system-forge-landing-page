import { Container } from '@/components/ui/Container'
import { CTAGroup } from '@/components/ui/CTAGroup'
import { buildDefaultCTAs } from '@/lib/cta'

const trustSignals = [
  '✓ Orçamento gratuito e sem compromisso',
  '✓ Resposta em até 2 horas',
  '✓ Contrato claro com garantia de entrega',
  '✓ Código seu, sem lock-in',
]

export function CTASection() {
  const ctas = buildDefaultCTAs('desenvolvimento de software sob medida')

  return (
    <section
      data-testid="section-cta"
      aria-label="Fale com a SystemForge"
      className="w-full bg-primary py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
              Pronto para transformar sua ideia em software?
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Fale com a gente agora. Sem enrolação — analisamos seu projeto e
              apresentamos uma proposta em até 24 horas.
            </p>
          </div>

          <CTAGroup configs={ctas} layout="horizontal" size="lg" />

          <ul className="flex flex-wrap gap-4 justify-center" aria-label="Diferenciais">
            {trustSignals.map((signal) => (
              <li key={signal} className="text-sm text-primary-foreground/70">
                {signal}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
