import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { ROUTES } from '@/lib/constants'

export default function NotFound() {
  return (
    <section data-testid="page-not-found" className="flex-1 flex items-center justify-center py-20">
      <Container>
        <div className="flex flex-col items-center gap-6 text-center max-w-lg mx-auto">
          <div
            className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-4xl"
            aria-hidden="true"
          >
            🔍
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
            <p className="text-muted-foreground leading-relaxed">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={ROUTES.home}
              data-testid="not-found-home-link"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] min-h-[44px]"
            >
              Voltar ao início
            </Link>
            <Link
              href={ROUTES.contato}
              data-testid="not-found-contact-link"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] min-h-[44px]"
            >
              Falar conosco
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
