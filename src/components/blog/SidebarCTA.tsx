import { CTAGroup } from '@/components/ui/CTAGroup'
import { buildBudgetCTA, buildWhatsAppCTA, buildEmailCTA } from '@/lib/cta'
import { type CTAConfig, ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { loadMessages } from '@config/content'
import { getSiteConfig } from '@config'

/**
 * SidebarCTA — card de conversão do artigo (3 vias de contato), sticky no
 * desktop / inline no mobile (o wrapper sticky vive no ArticlePage).
 *
 * Hierarquia de CTA (multi-* compliant):
 *   - WhatsApp (primary) — só quando config.whatsapp existe (ES não tem -> some);
 *   - Orçamento (secondary, ou primary se não há WhatsApp) — config.budgetEngine;
 *   - E-mail (ghost) — mailto config.email.
 * Tudo por-locale (número, quote URL, e-mail) e texto via loadMessages().
 * Server Component — CTAGroup/CTAButton carregam o boundary 'use client'.
 */
interface SidebarCTAProps {
  relatedService?: ServiceCategory
}

export function SidebarCTA({ relatedService }: SidebarCTAProps) {
  const m = loadMessages()
  const blogCTA = m.blog.cta
  const config = getSiteConfig()

  const serviceNamesMap = blogCTA.serviceNames as Record<string, string>
  const serviceName = (relatedService
    ? (serviceNamesMap[relatedService] ?? serviceNamesMap['default'])
    : serviceNamesMap['default']) ?? ''

  const ctx = `blog-sidebar-${relatedService ?? 'default'}`

  // ES (sem linha WhatsApp) cai para Orçamento como primário — nunca um botão
  // WhatsApp com href vazio.
  const ctas: CTAConfig[] = []
  if (config.whatsapp) ctas.push(buildWhatsAppCTA(m.cta.whatsapp, ctx))
  ctas.push({ ...buildBudgetCTA(m.cta.budget, ctx), variant: config.whatsapp ? 'secondary' : 'primary' })
  ctas.push({ ...buildEmailCTA(m.cta.email, ctx), variant: 'ghost' })

  const sidebarTitle = blogCTA.sidebarNeed.replace('{name}', serviceName)

  return (
    <aside
      data-testid="sidebar-cta"
      aria-label={`CTA: ${serviceName}`}
      className="rounded-[var(--radius-lg)] border border-border bg-gradient-to-b from-accent/30 to-background p-5 shadow-sm flex flex-col gap-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {blogCTA.helpTitle}
      </p>
      <p className="font-semibold text-base text-foreground leading-snug">
        {sidebarTitle}
      </p>

      <CTAGroup configs={ctas} layout="vertical" size="sm" />

      <p className="text-xs text-muted-foreground text-center">{blogCTA.replyTime}</p>

      {relatedService && (
        <a
          data-testid="sidebar-cta-service-link"
          href={ROUTES.SERVICE(relatedService)}
          aria-label={`${blogCTA.viewService} ${serviceName}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center underline-offset-4 hover:underline"
        >
          {blogCTA.viewService}
        </a>
      )}
    </aside>
  )
}
