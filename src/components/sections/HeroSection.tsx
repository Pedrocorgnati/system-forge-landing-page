import { CTAGroup } from '@/components/ui/CTAGroup'
import { Container } from '@/components/ui/Container'
import { buildDefaultCTAs } from '@/lib/cta'
import { SITE } from '@/lib/constants'

const stats = [
  { value: '50+', label: 'Projetos entregues' },
  { value: '100%', label: 'No prazo' },
  { value: '5', label: 'Anos de experiência' },
  { value: '24/7', label: 'Suporte pós-entrega' },
]

export function HeroSection() {
  const ctas = buildDefaultCTAs()

  return (
    <section
      data-testid="section-hero"
      aria-label="Apresentação SystemForge"
      className="relative w-full overflow-hidden bg-background"
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/30 blur-3xl -translate-x-1/3 translate-y-1/4" />
      </div>

      <Container>
        <div className="py-20 md:py-28 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column — content */}
          <div className="flex flex-col gap-6 max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
              <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
              Software House · Curitiba, PR
            </div>

            {/* Headline */}
            <h1 data-testid="hero-headline" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
              Software sob medida para{' '}
              <span className="text-primary">transformar negócios</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground leading-relaxed">
              Da landing page ao sistema complexo com IA — entregamos software de alta qualidade
              com documentação completa, código limpo e suporte dedicado.
            </p>

            {/* CTAs */}
            <CTAGroup configs={ctas} layout="horizontal" size="lg" />

            {/* Trust signals */}
            <p className="text-sm text-muted-foreground">
              ✓ Sem fidelidade &nbsp;&nbsp; ✓ Orçamento gratuito &nbsp;&nbsp; ✓ Resposta em até 2h
            </p>
          </div>

          {/* Right column — illustration */}
          <div className="hidden lg:flex items-center justify-center">
            {/* @ASSET_PLACEHOLDER
            name: hero-illustration
            type: image
            extension: svg
            format: 4:3
            dimensions: 600x450
            description: Ilustração abstrata moderna representando desenvolvimento de software. Elementos geométricos que sugerem código, conectividade, blocos de construção digitais e transformação tecnológica. Estilo neo-minimalista com linhas finas.
            context: Seção hero da landing page, coluna direita em desktop
            style: Neo-minimalista, linhas finas, formas geométricas
            mood: Profissional, moderno, confiável, tecnológico
            colors: primary (#2563EB), accent (#BFDBFE), background (#FFFFFF)
            elements: Janelas de código, grafos de nós, engrenagens abstratas, linhas de conexão
            avoid: Imagens genéricas de teclado, pessoas foto-realistas, gradientes pesados
            */}
            <div
              className="w-full max-w-[480px] aspect-[4/3] rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-4 p-8"
              role="img"
              aria-label="Ilustração de desenvolvimento de software"
            >
              <div className="text-7xl" aria-hidden="true">⚡</div>
              <div className="text-center">
                <p className="font-semibold text-foreground">SystemForge</p>
                <p className="text-sm text-muted-foreground">{SITE.tagline}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div data-testid="hero-stats" className="border-t border-border pb-12">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <dt className="text-3xl font-bold text-primary">{stat.value}</dt>
                <dd className="text-sm text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  )
}
