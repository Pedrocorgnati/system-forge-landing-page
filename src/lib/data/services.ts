/**
 * lib/data/services.ts
 * 11 serviços resumidos para listagens (ServicesGrid, cards, etc.)
 */
import { ServiceCategory } from '../types'
import type { ServiceData } from '../types'

export const servicesData: ServiceData[] = [
  {
    slug: ServiceCategory.SAAS,
    label: 'SaaS',
    description: 'Plataformas web sob assinatura com autenticação, multi-tenant e cobrança recorrente.',
    icon: '☁️',
  },
  {
    slug: ServiceCategory.MOBILE,
    label: 'Aplicativo Mobile',
    description: 'Apps iOS e Android com React Native, performance nativa e publicação nas lojas.',
    icon: '📱',
  },
  {
    slug: ServiceCategory.MARKETPLACE,
    label: 'Marketplace',
    description: 'Plataformas com múltiplos vendedores, pagamentos, avaliações e gestão de disputas.',
    icon: '🏪',
  },
  {
    slug: ServiceCategory.AI,
    label: 'Automação com IA',
    description: 'Sistemas inteligentes com GPT-4, análise de documentos, geração de conteúdo e NLP.',
    icon: '🤖',
  },
  {
    slug: ServiceCategory.BOTS,
    label: 'Bots & Automações',
    description: 'Bots WhatsApp/Telegram, automação de processos, scraping e integrações via n8n/Zapier.',
    icon: '⚡',
  },
  {
    slug: ServiceCategory.LANDING_PAGE,
    label: 'Landing Page',
    description: 'Sites institucionais e landing pages com alta conversão, blog e SEO técnico avançado.',
    icon: '🌐',
  },
  {
    slug: ServiceCategory.ECOMMERCE,
    label: 'E-commerce',
    description: 'Lojas virtuais com catálogo, carrinho, pagamento, estoque e painel administrativo.',
    icon: '🛒',
  },
  {
    slug: ServiceCategory.DASHBOARD,
    label: 'Dashboard B2B',
    description: 'Painéis analíticos com gráficos em tempo real, filtros, exports e KPIs customizados.',
    icon: '📊',
  },
  {
    slug: ServiceCategory.API,
    label: 'API & Integrações',
    description: 'APIs RESTful/GraphQL, webhooks, integrações ERP/CRM e middleware de dados.',
    icon: '🔌',
  },
  {
    slug: ServiceCategory.DESKTOP,
    label: 'Desktop',
    description: 'Aplicativos desktop multiplataforma com Electron, suporte offline e atualizações automáticas.',
    icon: '🖥️',
  },
  {
    slug: ServiceCategory.GESTAO,
    label: 'Gestão Setorial',
    description: 'Sistemas verticais para saúde, educação, imobiliário, jurídico e varejo.',
    icon: '🏢',
  },
]

/** Busca serviço por slug (ServiceCategory) */
export function getServiceBySlug(slug: ServiceCategory): ServiceData | undefined {
  return servicesData.find(s => s.slug === slug)
}
