import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTASection } from '@/components/sections/CTASection'
import { ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Conselheiro de IA',
  description:
    'Conselheiro de IA da SystemForge: análise rápida do seu projeto de software com recomendações personalizadas de tecnologia, arquitetura e investimento.',
  alternates: { canonical: '/conselheiro' },
}

const breadcrumbs = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Conselheiro', href: ROUTES.conselheiro },
]

export default function ConselheiroPage() {
  return (
    <>
      <div data-testid="page-conselheiro" className="py-12 md:py-16 bg-background">
        <Container>
          <div className="flex flex-col gap-8">
            <Breadcrumb items={breadcrumbs} />

            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
                Em breve
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                Conselheiro de IA
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Descreva seu projeto e receba em segundos uma análise completa com
                recomendações de tecnologia, estimativa de investimento e roadmap sugerido.
              </p>
            </div>

            {/* Coming soon card */}
            <div className="flex flex-col items-center gap-6 py-16 rounded-2xl border border-border border-dashed bg-surface max-w-2xl">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl" aria-hidden="true">
                🤖
              </div>
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  Ferramenta em desenvolvimento
                </h2>
                <p className="text-muted-foreground max-w-xs">
                  O Conselheiro de IA estará disponível em breve. Enquanto isso, fale
                  diretamente com nossa equipe para uma análise personalizada.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
      <CTASection />
    </>
  )
}
