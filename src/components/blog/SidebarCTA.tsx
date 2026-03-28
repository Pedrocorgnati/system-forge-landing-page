import { CTAButton } from '@/components/ui/CTAButton'
import { buildWhatsAppCTA } from '@/lib/cta'
import { ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

/**
 * SidebarCTA — banner lateral sticky (desktop) ou inline (mobile).
 *
 * INT-009, INT-070 — Should: link para landing page do serviço relevante.
 * Desktop: sticky lateral à direita do conteúdo.
 * Mobile: inline, antes do CTAContextual.
 */

interface SidebarCTAProps {
  relatedService?: ServiceCategory
}

const serviceNames: Partial<Record<ServiceCategory, string>> = {
  [ServiceCategory.SAAS]: 'Desenvolvimento SaaS',
  [ServiceCategory.MOBILE]: 'Aplicativo Mobile',
  [ServiceCategory.MARKETPLACE]: 'Marketplace',
  [ServiceCategory.AI]: 'Automação com IA',
  [ServiceCategory.BOTS]: 'Bots e Automações',
  [ServiceCategory.LANDING_PAGE]: 'Landing Page',
  [ServiceCategory.ECOMMERCE]: 'E-commerce',
  [ServiceCategory.DASHBOARD]: 'Dashboard B2B',
  [ServiceCategory.API]: 'API e Integrações',
  [ServiceCategory.DESKTOP]: 'Software Desktop',
  [ServiceCategory.GESTAO]: 'Gestão Setorial',
}

export function SidebarCTA({ relatedService }: SidebarCTAProps) {
  const serviceName = relatedService ? (serviceNames[relatedService] ?? 'Desenvolvimento de Software') : 'Desenvolvimento de Software'
  const whatsappCTA = buildWhatsAppCTA('Falar no WhatsApp', `sidebar-cta-${relatedService ?? 'default'}`)

  return (
    <aside
      data-testid="sidebar-cta"
      aria-label={`CTA: ${serviceName}`}
      className="p-4 rounded-xl border border-border bg-accent/20 flex flex-col gap-3"
    >
      <p className="font-semibold text-sm text-foreground leading-snug">
        Precisa de {serviceName}?
      </p>

      <CTAButton config={whatsappCTA} size="sm" variant="primary" fullWidth />

      {relatedService && (
        <a
          data-testid="sidebar-cta-service-link"
          href={ROUTES.SERVICE(relatedService)}
          aria-label={`Ver detalhes do serviço: ${serviceName}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Ver detalhes do serviço →
        </a>
      )}
    </aside>
  )
}
