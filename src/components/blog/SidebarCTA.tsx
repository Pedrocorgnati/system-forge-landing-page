import { CTAButton } from '@/components/ui/CTAButton'
import { buildWhatsAppCTA } from '@/lib/cta'
import { ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { loadMessages } from '@config/content'

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

export function SidebarCTA({ relatedService }: SidebarCTAProps) {
  const m = loadMessages()
  const blogCTA = m.blog.cta

  const serviceNamesMap = blogCTA.serviceNames as Record<string, string>
  const serviceName = (relatedService
    ? (serviceNamesMap[relatedService] ?? serviceNamesMap['default'])
    : serviceNamesMap['default']) ?? ''

  const whatsappLabel = m.cta.whatsapp
  const whatsappCTA = buildWhatsAppCTA(whatsappLabel, `sidebar-cta-${relatedService ?? 'default'}`)

  const sidebarTitle = blogCTA.sidebarNeed.replace('{name}', serviceName)

  return (
    <aside
      data-testid="sidebar-cta"
      aria-label={`CTA: ${serviceName}`}
      className="p-4 rounded-xl border border-border bg-accent/20 flex flex-col gap-3"
    >
      <p className="font-semibold text-sm text-foreground leading-snug">
        {sidebarTitle}
      </p>

      <CTAButton config={whatsappCTA} size="sm" variant="primary" fullWidth />

      {relatedService && (
        <a
          data-testid="sidebar-cta-service-link"
          href={ROUTES.SERVICE(relatedService)}
          aria-label={`${blogCTA.viewService} ${serviceName}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          {blogCTA.viewService}
        </a>
      )}
    </aside>
  )
}
