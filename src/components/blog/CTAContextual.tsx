import { CTAGroup } from '@/components/ui/CTAGroup'
import { buildDefaultCTAs } from '@/lib/cta'
import { ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { loadMessages } from '@config/content'

/**
 * CTAContextual — CTA contextualizado pelo serviço relacionado ao artigo.
 *
 * FEAT-BL-003, INT-007, INT-008, INT-095
 * Seção de ajuda com os 3 CTAs padrão sempre presente.
 */

interface CTAContextualProps {
  relatedService?: ServiceCategory
}

export function CTAContextual({ relatedService }: CTAContextualProps) {
  const m = loadMessages()
  const blogCTA = m.blog.cta

  const serviceEntry = relatedService
    ? (blogCTA.services as Record<string, { title: string; subtitle: string }>)[relatedService]
    : undefined

  const title = serviceEntry?.title ?? blogCTA.defaultTitle
  const subtitle = serviceEntry?.subtitle ?? blogCTA.defaultSubtitle

  const ctaContext = relatedService ? `blog-cta-${relatedService}` : 'blog-cta-default'
  const ctas = buildDefaultCTAs(ctaContext)

  return (
    <section
      data-testid="blog-cta-contextual"
      aria-labelledby="cta-contextual-heading"
      className="my-10 p-6 sm:p-8 rounded-2xl bg-accent/30 border border-border"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h3 id="cta-contextual-heading" className="text-xl sm:text-2xl font-bold text-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground">{subtitle}</p>

          {/* Link contextual para página do serviço (INT-047) */}
          {relatedService && (
            <a
              href={ROUTES.SERVICE(relatedService)}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              {blogCTA.learnMore} →
            </a>
          )}
        </div>

        {/* Seção de ajuda com 3 CTAs (INT-008) */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">{blogCTA.helpTitle}</p>
          <CTAGroup configs={ctas} layout="horizontal" />
        </div>
      </div>
    </section>
  )
}
