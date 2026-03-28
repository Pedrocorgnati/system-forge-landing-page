import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import Link from 'next/link'
import { Home, MessageCircle } from 'lucide-react'

export default function NotFound() {
  const config = getSiteConfig()
  const messages = loadMessages()
  const m = messages.notFound

  return (
    <main data-testid="notfound-page" className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p data-testid="notfound-error-code" className="text-8xl font-bold text-primary/20">{m.code}</p>
        <h1 data-testid="notfound-heading" className="mt-4 text-3xl font-bold text-foreground">{m.title}</h1>
        <p className="mt-3 text-lg text-foreground/60">{m.description}</p>
        <div className="mt-8 flex gap-4 justify-center flex-col sm:flex-row">
          <Link
            href={config.routes.home}
            data-testid="notfound-home-link"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            {m.homeButton}
          </Link>
          <Link
            href={config.routes.contact}
            data-testid="notfound-contact-link"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4" />
            {m.contactButton}
          </Link>
        </div>
      </div>
    </main>
  )
}
