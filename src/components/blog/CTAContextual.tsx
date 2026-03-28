import { CTAGroup } from '@/components/ui/CTAGroup'
import { buildDefaultCTAs } from '@/lib/cta'
import { ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

/**
 * CTAContextual — CTA contextualizado pelo serviço relacionado ao artigo.
 *
 * FEAT-BL-003, INT-007, INT-008, INT-095
 * Seção "Precisa de ajuda?" com os 3 CTAs padrão sempre presente.
 */

interface CTAContextualProps {
  relatedService?: ServiceCategory
}

interface ServiceCTAContent {
  title: string
  subtitle: string
}

// Conteúdo contextual por serviço (INT-095)
const ctaContentByService: Partial<Record<ServiceCategory, ServiceCTAContent>> = {
  [ServiceCategory.SAAS]: {
    title: 'Precisa de Desenvolvimento SaaS?',
    subtitle: 'A SystemForge constrói plataformas SaaS escaláveis do zero até o deploy.',
  },
  [ServiceCategory.MOBILE]: {
    title: 'Precisa de um Aplicativo Mobile?',
    subtitle: 'Desenvolvemos apps iOS e Android com React Native ou Flutter.',
  },
  [ServiceCategory.MARKETPLACE]: {
    title: 'Quer criar um Marketplace?',
    subtitle: 'Entregamos plataformas de marketplace B2B e B2C completas.',
  },
  [ServiceCategory.AI]: {
    title: 'Quer Automatizar com IA?',
    subtitle: 'Implementamos soluções de IA e automação para empresas de todos os tamanhos.',
  },
  [ServiceCategory.BOTS]: {
    title: 'Precisa de Bots e Automações?',
    subtitle: 'Desenvolvemos bots e automações personalizadas para o seu negócio.',
  },
  [ServiceCategory.LANDING_PAGE]: {
    title: 'Precisa de uma Landing Page?',
    subtitle: 'Criamos landing pages de alta conversão com SEO e performance.',
  },
  [ServiceCategory.ECOMMERCE]: {
    title: 'Quer criar seu E-commerce?',
    subtitle: 'Desenvolvemos lojas virtuais completas, do catálogo ao checkout.',
  },
  [ServiceCategory.DASHBOARD]: {
    title: 'Precisa de um Dashboard B2B?',
    subtitle: 'Construímos dashboards analíticos e painéis de gestão sob medida.',
  },
  [ServiceCategory.API]: {
    title: 'Precisa de API e Integrações?',
    subtitle: 'Desenvolvemos APIs robustas e integramos com qualquer sistema.',
  },
  [ServiceCategory.DESKTOP]: {
    title: 'Precisa de Software Desktop?',
    subtitle: 'Desenvolvemos aplicativos desktop multiplataforma com Electron ou Tauri.',
  },
  [ServiceCategory.GESTAO]: {
    title: 'Precisa de Software de Gestão Setorial?',
    subtitle: 'Desenvolvemos sistemas de gestão personalizados para o seu setor.',
  },
}

const defaultContent: ServiceCTAContent = {
  title: 'Transforme sua ideia em software',
  subtitle: 'A SystemForge constrói produtos digitais do zero até o lançamento.',
}

export function CTAContextual({ relatedService }: CTAContextualProps) {
  const content = relatedService ? (ctaContentByService[relatedService] ?? defaultContent) : defaultContent
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
            {content.title}
          </h3>
          <p className="text-muted-foreground">{content.subtitle}</p>

          {/* Link contextual para página do serviço (INT-047) */}
          {relatedService && (
            <a
              href={ROUTES.SERVICE(relatedService)}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Saiba mais sobre {content.title.replace('Precisa de ', '').replace('Quer ', '').replace('?', '')} →
            </a>
          )}
        </div>

        {/* Seção "Precisa de ajuda?" com 3 CTAs (INT-008) */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Precisa de ajuda?</p>
          <CTAGroup configs={ctas} layout="horizontal" />
        </div>
      </div>
    </section>
  )
}
