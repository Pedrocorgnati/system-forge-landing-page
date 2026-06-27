'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { buttonVariants } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants/routes'
import { getLocale, type SupportedLocale } from '@config'

type ErrorEntry = { title: string; description: string }

type ConfirmCopy = {
  errors: Record<string, ErrorEntry>
  defaultError: ErrorEntry
  success: { title: string; body: string; note: string }
  pending: { title: string; description: string }
  backToBlog: string
  backToHome: string
}

const brCopy: ConfirmCopy = {
  errors: {
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
  },
  defaultError: {
    title: 'Erro inesperado',
    description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
  },
  success: {
    title: 'Inscrição confirmada!',
    body: 'Obrigado por confirmar seu email. Você agora receberá nossas atualizações sobre desenvolvimento web, cases e novidades da SystemForge.',
    note: 'Você pode cancelar a inscrição a qualquer momento pelo link no rodapé dos emails.',
  },
  pending: {
    title: 'Newsletter SystemForge',
    description: 'Aguardando confirmação da sua inscrição. Verifique seu email.',
  },
  backToBlog: 'Voltar ao blog',
  backToHome: 'Voltar ao início',
}

const itCopy: ConfirmCopy = {
  errors: {
    token_missing: {
      title: 'Link incompleto',
      description: "Il link di conferma è incompleto. Verifica di aver copiato l'intero link dall'email.",
    },
    token_invalid: {
      title: 'Link scaduto o non valido',
      description: 'Questo link di conferma è scaduto (48h) o è già stato utilizzato. Iscriviti di nuovo al blog.',
    },
    activation_failed: {
      title: 'Errore di conferma',
      description: 'Si è verificato un errore durante l\'elaborazione della tua conferma. Riprova più tardi.',
    },
  },
  defaultError: {
    title: 'Errore imprevisto',
    description: 'Si è verificato un errore durante l\'elaborazione della tua richiesta. Riprova.',
  },
  success: {
    title: 'Iscrizione confermata!',
    body: 'Grazie per aver confermato la tua email. Da ora riceverai i nostri aggiornamenti su sviluppo web, case study e novità di SystemForge.',
    note: 'Puoi annullare l\'iscrizione in qualsiasi momento tramite il link nel piè di pagina delle email.',
  },
  pending: {
    title: 'Newsletter SystemForge',
    description: 'In attesa della conferma della tua iscrizione. Controlla la tua email.',
  },
  backToBlog: 'Torna al blog',
  backToHome: 'Torna alla home',
}

const enCopy: ConfirmCopy = {
  errors: {
    token_missing: {
      title: 'Incomplete link',
      description: 'The confirmation link is incomplete. Make sure you copied the entire link from the email.',
    },
    token_invalid: {
      title: 'Link expired or invalid',
      description: 'This confirmation link has expired (48h) or has already been used. Please subscribe to the blog again.',
    },
    activation_failed: {
      title: 'Confirmation error',
      description: 'An error occurred while processing your confirmation. Please try again later.',
    },
  },
  defaultError: {
    title: 'Unexpected error',
    description: 'An error occurred while processing your request. Please try again.',
  },
  success: {
    title: 'Subscription confirmed!',
    body: 'Thank you for confirming your email. You will now receive our updates on web development, case studies, and SystemForge news.',
    note: 'You can unsubscribe at any time using the link in the footer of our emails.',
  },
  pending: {
    title: 'SystemForge Newsletter',
    description: 'Waiting for your subscription to be confirmed. Please check your email.',
  },
  backToBlog: 'Back to blog',
  backToHome: 'Back to home',
}

const esCopy: ConfirmCopy = {
  errors: {
    token_missing: {
      title: 'Enlace incompleto',
      description: 'El enlace de confirmación está incompleto. Comprueba que has copiado el enlace completo del correo.',
    },
    token_invalid: {
      title: 'Enlace caducado o no válido',
      description: 'Este enlace de confirmación ha caducado (48h) o ya se ha utilizado. Vuelve a suscribirte al blog.',
    },
    activation_failed: {
      title: 'Error al confirmar',
      description: 'Se ha producido un error al procesar tu confirmación. Inténtalo de nuevo más tarde.',
    },
  },
  defaultError: {
    title: 'Error inesperado',
    description: 'Se ha producido un error al procesar tu solicitud. Inténtalo de nuevo.',
  },
  success: {
    title: '¡Suscripción confirmada!',
    body: 'Gracias por confirmar tu correo. A partir de ahora recibirás nuestras novedades sobre desarrollo web, casos de éxito y noticias de SystemForge.',
    note: 'Puedes cancelar la suscripción en cualquier momento mediante el enlace en el pie de página de los correos.',
  },
  pending: {
    title: 'Newsletter SystemForge',
    description: 'Esperando la confirmación de tu suscripción. Revisa tu correo.',
  },
  backToBlog: 'Volver al blog',
  backToHome: 'Volver al inicio',
}

const COPY: Record<SupportedLocale, ConfirmCopy> = {
  'pt-BR': brCopy,
  'it-IT': itCopy,
  'en': enCopy,
  'es-ES': esCopy,
}

const copy = COPY[getLocale()]

export function NewsletterConfirmadoContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const errorCode = searchParams.get('error')

  if (errorCode) {
    const errorInfo = copy.errors[errorCode] ?? copy.defaultError

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
            {copy.backToBlog}
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
            {copy.success.title}
          </h1>

          <p className="text-foreground/70 mb-2">
            {copy.success.body}
          </p>

          <p className="text-sm text-foreground/50 mb-8">
            {copy.success.note}
          </p>

          <Link
            href={ROUTES.HOME}
            className={buttonVariants()}
          >
            {copy.backToHome}
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
          {copy.pending.title}
        </h1>

        <p className="text-foreground/70 mb-8">
          {copy.pending.description}
        </p>

        <Link
          href={ROUTES.BLOG ?? '/blog'}
          className={buttonVariants()}
        >
          {copy.backToBlog}
        </Link>
      </div>
    </Container>
  )
}
