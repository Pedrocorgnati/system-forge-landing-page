import { Suspense } from 'react'
import { generatePageMetadata } from '@/lib/seo'
import { getLocale, type SupportedLocale } from '@config'
import { NewsletterConfirmadoContent } from './content'

type PageCopy = { title: string; description: string; loading: string }

const PAGE_COPY: Record<SupportedLocale, PageCopy> = {
  'pt-BR': {
    title: 'Newsletter — SystemForge',
    description: 'Status da sua inscrição na newsletter SystemForge.',
    loading: 'Carregando...',
  },
  'it-IT': {
    title: 'Newsletter — SystemForge',
    description: 'Stato della tua iscrizione alla newsletter SystemForge.',
    loading: 'Caricamento...',
  },
  'en': {
    title: 'Newsletter — SystemForge',
    description: 'Status of your SystemForge newsletter subscription.',
    loading: 'Loading...',
  },
  'es-ES': {
    title: 'Newsletter — SystemForge',
    description: 'Estado de tu suscripción a la newsletter SystemForge.',
    loading: 'Cargando...',
  },
}

const pageCopy = PAGE_COPY[getLocale()]

export const metadata = generatePageMetadata({
  title: pageCopy.title,
  description: pageCopy.description,
  path: '/newsletter/confirmado',
  noIndex: true,
})

export default function NewsletterConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-foreground/50">{pageCopy.loading}</p>
        </div>
      }
    >
      <NewsletterConfirmadoContent />
    </Suspense>
  )
}
