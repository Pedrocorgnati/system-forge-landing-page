import type { Metadata } from 'next'
import { ContactSection } from '@/components/sections/ContactSection'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'

const config = getSiteConfig()
const messages = loadMessages()

export const metadata: Metadata = generatePageMetadata({
  title: 'Contato',
  description: `Entre em contato com a ${config.siteName}. Respondemos em até 2 horas em dias úteis via WhatsApp ou e-mail.`,
  path: '/contato',
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: 'Contato', href: '/contato' },
]

export default function ContatoPage() {
  return (
    <>
      <div data-testid="page-contato" className="py-12 md:py-16 bg-background">
        <Container>
          <Breadcrumb items={breadcrumbs} />
        </Container>
      </div>
      <ContactSection />
    </>
  )
}
