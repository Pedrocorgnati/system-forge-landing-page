import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NewsletterConfirmadoContent } from './content'

export const metadata: Metadata = {
  title: 'Newsletter — SystemForge',
  description: 'Status da sua inscrição na newsletter SystemForge.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NewsletterConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-foreground/50">Carregando...</p>
        </div>
      }
    >
      <NewsletterConfirmadoContent />
    </Suspense>
  )
}
