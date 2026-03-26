'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants/routes'

const errorMessages: Record<string, { title: string; description: string }> = {
  token_missing: {
    title: 'Link incompleto',
    description: 'O link de confirmação está incompleto. Verifique se copiou o link inteiro do email.',
  },
  token_invalid: {
    title: 'Link expirado ou inválido',
    description: 'Este link de confirmação expirou (48h) ou já foi utilizado. Inscreva-se novamente no blog.',
  },
  activation_failed: {
    title: 'Erro ao confirmar',
    description: 'Ocorreu um erro ao processar sua confirmação. Tente novamente mais tarde.',
  },
}

export function NewsletterConfirmadoContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const errorCode = searchParams.get('error')

  if (errorCode) {
    const errorInfo = errorMessages[errorCode] ?? {
      title: 'Erro inesperado',
      description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
    }

    return (
      <Container>
        <div
          data-testid="page-newsletter-confirmado"
          className="flex flex-col items-center justify-center min-h-[60vh] text-center py-16 max-w-lg mx-auto"
        >
          <div
            className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-6"
            aria-hidden="true"
          >
            <svg
              className="w-8 h-8 text-destructive"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            {errorInfo.title}
          </h1>

          <p className="text-foreground/70 mb-8">
            {errorInfo.description}
          </p>

          <Link
            href={ROUTES.BLOG ?? '/blog'}
            className={buttonVariants()}
          >
            Voltar ao blog
          </Link>
        </div>
      </Container>
    )
  }

  if (isSuccess) {
    return (
      <Container>
        <div
          data-testid="page-newsletter-confirmado"
          className="flex flex-col items-center justify-center min-h-[60vh] text-center py-16 max-w-lg mx-auto"
        >
          <div
            className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-6"
            aria-hidden="true"
          >
            <svg
              className="w-8 h-8 text-success"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Inscrição confirmada!
          </h1>

          <p className="text-foreground/70 mb-2">
            Obrigado por confirmar seu email. Você agora receberá nossas atualizações sobre
            desenvolvimento web, cases e novidades da SystemForge.
          </p>

          <p className="text-sm text-foreground/50 mb-8">
            Você pode cancelar a inscrição a qualquer momento pelo link no rodapé dos emails.
          </p>

          <Link
            href={ROUTES.HOME}
            className={buttonVariants()}
          >
            Voltar ao início
          </Link>
        </div>
      </Container>
    )
  }

  // Estado default — sem parâmetros
  return (
    <Container>
      <div
        data-testid="page-newsletter-confirmado"
        className="flex flex-col items-center justify-center min-h-[60vh] text-center py-16 max-w-lg mx-auto"
      >
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Newsletter SystemForge
        </h1>

        <p className="text-foreground/70 mb-8">
          Aguardando confirmação da sua inscrição. Verifique seu email.
        </p>

        <Link
          href={ROUTES.BLOG ?? '/blog'}
          className={buttonVariants()}
        >
          Voltar ao blog
        </Link>
      </div>
    </Container>
  )
}
