import { CTAButton } from '@/components/ui/CTAButton'
import { buildBudgetCTA, buildWhatsAppCTA, buildEmailCTA } from '@/lib/cta'
import { type CTAConfig, ServiceCategory } from '@/lib/types'
import { loadMessages } from '@config/content'
import { getSiteConfig } from '@config'

/**
 * BlogMobileCTABar — barra de conversão fixa no rodapé, SÓ no mobile (md:hidden).
 * No artigo o SidebarCTA fica no topo (inline) e some ao rolar; esta barra mantém
 * um CTA persistente no mobile (onde está 65-75% do tráfego). O WhatsApp flutuante
 * é `hidden md:flex` (desktop), então não há sobreposição.
 *
 * Multi-* : número/quote/e-mail por-locale; ES (sem WhatsApp) cai para
 * Orçamento(primary)+E-mail. Server Component (CTAButton = client island).
 */
interface BlogMobileCTABarProps {
  relatedService?: ServiceCategory
}

export function BlogMobileCTABar({ relatedService }: BlogMobileCTABarProps) {
  const m = loadMessages()
  const config = getSiteConfig()
  const ctx = `blog-mobilebar-${relatedService ?? 'default'}`

  const ctas: CTAConfig[] = []
  if (config.whatsapp) {
    ctas.push(buildWhatsAppCTA(m.cta.whatsapp, ctx))
    ctas.push({ ...buildBudgetCTA(m.cta.budget, ctx), variant: 'secondary' })
  } else {
    ctas.push({ ...buildBudgetCTA(m.cta.budget, ctx), variant: 'primary' })
    ctas.push({ ...buildEmailCTA(m.cta.email, ctx), variant: 'secondary' })
  }

  return (
    <div
      data-testid="blog-mobile-cta-bar"
      className="fixed inset-x-0 bottom-0 z-30 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex gap-2">
        {ctas.map((c) => (
          <CTAButton key={c.action} config={c} size="sm" className="flex-1" />
        ))}
      </div>
    </div>
  )
}
