import { Suspense } from 'react'
import { generatePageMetadata } from '@/lib/seo'
import { NewsletterConfirmadoContent } from './content'

export const metadata = generatePageMetadata({
  title: 'Newsletter — SystemForge',
  description: 'Status da sua inscrição na newsletter SystemForge.',
  path: '/newsletter/confirmado',
  noIndex: true,
})

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
