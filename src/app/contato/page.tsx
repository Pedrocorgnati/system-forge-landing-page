import type { Metadata } from 'next'
import { ContactSection } from '@/components/sections/ContactSection'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getSiteConfig, type SupportedLocale } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'

const config = getSiteConfig()
const messages = loadMessages()

/**
 * Copy da página "Contato" resolvida pelo locale do build (`NEXT_PUBLIC_LOCALE`).
 * O corpo usa ContactSection (já localizado); aqui localizamos apenas o metadata
 * e o label do breadcrumb via Record inline. O crumb "Home" reusa
 * messages.breadcrumb.home.
 */
const brContactCopy = {
  metaTitle: 'Contato',
  metaDescription: `Entre em contato com a ${config.siteName}. Respondemos em até 2 horas em dias úteis via WhatsApp ou e-mail.`,
  breadcrumb: 'Contato',
}

const CONTACT_COPY: Record<SupportedLocale, typeof brContactCopy> = {
  'pt-BR': brContactCopy,
  'it-IT': {
    metaTitle: 'Contatti',
    metaDescription: `Contatta ${config.siteName}. Rispondiamo entro 2 ore nei giorni lavorativi via WhatsApp o email.`,
    breadcrumb: 'Contatti',
  },
  'en': {
    metaTitle: 'Contact',
    metaDescription: `Get in touch with ${config.siteName}. We reply within 2 hours on business days via WhatsApp or email.`,
    breadcrumb: 'Contact',
  },
  'es-ES': {
    metaTitle: 'Contacto',
    metaDescription: `Ponte en contacto con ${config.siteName}. Respondemos en menos de 2 horas en días laborables por WhatsApp o correo electrónico.`,
    breadcrumb: 'Contacto',
  },
}

const contactCopy = CONTACT_COPY[config.locale]

export const metadata: Metadata = generatePageMetadata({
  title: contactCopy.metaTitle,
  description: contactCopy.metaDescription,
  path: '/contato',
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: contactCopy.breadcrumb, href: '/contato' },
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
