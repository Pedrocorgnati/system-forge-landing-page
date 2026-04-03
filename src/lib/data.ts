import { ServiceCategory, TechTag, ProjectStatus, DeliveryCountry } from './types'
import type { Service, PortfolioProject, Testimonial, ServiceFilterGroup } from './types'
import { loadServicesContent, loadPortfolioDescriptions } from '@config/content'

// ── Non-translatable service base config ──────────────────────────────────────
// contentId maps to the id in content/{locale}/pages/services.json
const SERVICE_BASE: {
  slug: string
  contentId: string
  icon: string
  category: ServiceCategory
  techHints: string[]
  deliveryRange: string
  filterGroup: ServiceFilterGroup
}[] = [
  { slug: 'saas', contentId: 'saas', icon: '🚀', category: ServiceCategory.SAAS, techHints: ['Next.js', 'Stripe', 'PostgreSQL'], deliveryRange: '8–16', filterGroup: 'produto' },
  { slug: 'mobile', contentId: 'aplicativo-mobile', icon: '📱', category: ServiceCategory.MOBILE, techHints: ['React Native', 'Expo'], deliveryRange: '10–18', filterGroup: 'mobile-ia' },
  { slug: 'aplicativo-mobile', contentId: 'aplicativo-mobile', icon: '📱', category: ServiceCategory.MOBILE, techHints: ['React Native', 'Expo'], deliveryRange: '10–18', filterGroup: 'mobile-ia' }, // RESOLVED: /servicos/aplicativo-mobile
  { slug: 'landing-page', contentId: 'landing-page', icon: '🌐', category: ServiceCategory.LANDING, techHints: ['Next.js', 'Tailwind'], deliveryRange: '2–4', filterGroup: 'produto' },
  { slug: 'ecommerce', contentId: 'e-commerce', icon: '🛒', category: ServiceCategory.ECOMMERCE, techHints: ['Next.js', 'Stripe'], deliveryRange: '8–14', filterGroup: 'produto' },
  { slug: 'e-commerce', contentId: 'e-commerce', icon: '🛒', category: ServiceCategory.ECOMMERCE, techHints: ['Next.js', 'Stripe'], deliveryRange: '8–14', filterGroup: 'produto' },
  { slug: 'dashboard', contentId: 'dashboard-b2b', icon: '📊', category: ServiceCategory.DASHBOARD, techHints: ['Next.js', 'Recharts'], deliveryRange: '6–12', filterGroup: 'dados' },
  { slug: 'dashboard-b2b', contentId: 'dashboard-b2b', icon: '📊', category: ServiceCategory.DASHBOARD, techHints: ['Next.js', 'Recharts'], deliveryRange: '6–12', filterGroup: 'dados' },
  { slug: 'api', contentId: 'api-integracoes', icon: '🔌', category: ServiceCategory.API, techHints: ['Node.js', 'REST / GraphQL'], deliveryRange: '3–8', filterGroup: 'dados' },
  { slug: 'api-integracoes', contentId: 'api-integracoes', icon: '🔌', category: ServiceCategory.API, techHints: ['Node.js', 'REST / GraphQL'], deliveryRange: '3–8', filterGroup: 'dados' }, // RESOLVED: /servicos/api-integracoes
  { slug: 'automacao-com-ia', contentId: 'automacao-com-ia', icon: '🤖', category: ServiceCategory.AI, techHints: ['Claude AI', 'OpenAI', 'Python'], deliveryRange: '4–10', filterGroup: 'mobile-ia' },
  { slug: 'marketplace', contentId: 'marketplace', icon: '🏪', category: ServiceCategory.MARKETPLACE, techHints: ['Next.js', 'Stripe Connect'], deliveryRange: '12–20', filterGroup: 'produto' },
  { slug: 'erp', contentId: 'erp', icon: '⚙️', category: ServiceCategory.ERP, techHints: ['Next.js', 'Prisma', 'PostgreSQL'], deliveryRange: '16–30', filterGroup: 'dados' },
  { slug: 'chatbot', contentId: 'bots-automacoes', icon: '💬', category: ServiceCategory.CHATBOT, techHints: ['Node.js', 'LLMs'], deliveryRange: '3–6', filterGroup: 'mobile-ia' },
  { slug: 'bots-automacoes', contentId: 'bots-automacoes', icon: '💬', category: ServiceCategory.CHATBOT, techHints: ['Node.js', 'n8n', 'WhatsApp API'], deliveryRange: '3–6', filterGroup: 'mobile-ia' }, // RESOLVED: /servicos/bots-automacoes
  { slug: 'gestao-setorial', contentId: 'gestao-setorial', icon: '🏭', category: ServiceCategory.GESTAO, techHints: ['Next.js', 'Prisma', 'PostgreSQL'], deliveryRange: '8–20', filterGroup: 'dados' }, // RESOLVED: /servicos/gestao-setorial
  { slug: 'consultoria', contentId: 'consultoria', icon: '🎯', category: ServiceCategory.CONSULTORIA, techHints: ['Stack agnóstico'], deliveryRange: '1–3', filterGroup: 'dados' },
  { slug: 'desktop', contentId: 'desktop', icon: '🖥️', category: ServiceCategory.DESKTOP, techHints: ['Electron', 'SQLite'], deliveryRange: '8–14', filterGroup: 'produto' },
]

// Build locale-aware content at module load time (locale is fixed per build)
const _portfolioDescriptions = loadPortfolioDescriptions()
const _servicesContent = loadServicesContent()
const _contentMap = new Map(_servicesContent.map(s => [s.id, s]))

export const services: Service[] = SERVICE_BASE.map(base => {
  const content = _contentMap.get(base.contentId)
  return {
    slug: base.slug,
    name: content?.title ?? base.slug,
    description: content?.description ?? '',
    longDescription: content?.longDescription ?? content?.description ?? '',
    icon: base.icon,
    category: base.category,
    deliverables: content?.features ?? [],
    techHints: base.techHints,
    deliveryWeeks: base.deliveryRange,
    filterGroup: base.filterGroup,
    benefits: content?.benefits,
    process: content?.process,
    useCases: content?.useCases,
    faq: content?.faq,
  }
})

const _portfolioProjectsRaw: PortfolioProject[] = [
  { slug: 'servizipercasa', name: 'ServiziPerCasa', title: 'ServiziPerCasa', description: 'Marketplace italiano conectando proprietários a profissionais de serviços domésticos. Booking, Stripe payments e dashboard analytics.', categories: [ServiceCategory.MARKETPLACE], techs: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.STRIPE, TechTag.CHARTJS], technologies: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.STRIPE, TechTag.CHARTJS], status: ProjectStatus.COMPLETED, featured: true, videoUrl: '/video/servizipercasa.mp4', countries: [DeliveryCountry.ITALIA] },
  { slug: 'piemontech', name: 'Piemontech', title: 'Piemontech', description: 'Plataforma B2B com landing page builder, diagnósticos IA, engine de prospecção e sistema de afiliados.', categories: [ServiceCategory.SAAS, ServiceCategory.AI], techs: [TechTag.NEXTJS, TechTag.CLAUDE_AI, TechTag.STRIPE, TechTag.PRISMA], technologies: [TechTag.NEXTJS, TechTag.CLAUDE_AI, TechTag.STRIPE, TechTag.PRISMA], status: ProjectStatus.COMPLETED, featured: true, videoUrl: '/video/piemontech.mp4', countries: [DeliveryCountry.ITALIA] },
  { slug: 'sistema-garantido', name: 'Sistema Garantido', title: 'Sistema Garantido', description: 'Gestão de garantias com 2FA, billing Stripe, Claude AI e lifecycle completo via Twilio.', categories: [ServiceCategory.SAAS, ServiceCategory.AI], techs: [TechTag.NEXTJS, TechTag.CLAUDE_AI, TechTag.TWILIO, TechTag.STRIPE, TechTag.PRISMA], technologies: [TechTag.NEXTJS, TechTag.CLAUDE_AI, TechTag.TWILIO, TechTag.STRIPE, TechTag.PRISMA], status: ProjectStatus.COMPLETED, featured: true, videoUrl: '/video/sistema-garantido.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'bicoja', name: 'BicoJá', title: 'BicoJá', description: 'Marketplace de serviços on-demand com web + React Native, moeda virtual e assinaturas premium.', categories: [ServiceCategory.MARKETPLACE, ServiceCategory.MOBILE], techs: [TechTag.NEXTJS, TechTag.REACT_NATIVE, TechTag.PRISMA, TechTag.STRIPE], technologies: [TechTag.NEXTJS, TechTag.REACT_NATIVE, TechTag.PRISMA, TechTag.STRIPE], status: ProjectStatus.COMPLETED, videoUrl: '/video/bicoja.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'stork-logistics', name: 'Stork Logistics', title: 'Stork Logistics', description: 'Plataforma logística end-to-end com tracking real-time, Recharts analytics e automação via Inngest.', categories: [ServiceCategory.DASHBOARD], techs: [TechTag.NEXTJS, TechTag.RECHARTS, TechTag.INNGEST, TechTag.TWILIO, TechTag.PRISMA], technologies: [TechTag.NEXTJS, TechTag.RECHARTS, TechTag.INNGEST, TechTag.TWILIO, TechTag.PRISMA], status: ProjectStatus.COMPLETED, featured: true, videoUrl: '/video/stork-logistics.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'divulga-facil', name: 'Divulga Fácil Dashboard', title: 'Divulga Fácil Dashboard', description: 'SaaS dashboard para 4 bots Telegram com webhooks Kiwify, limites de uso e analytics real-time.', categories: [ServiceCategory.SAAS], techs: [TechTag.NEXTJS, TechTag.POSTGRES, TechTag.STRIPE, TechTag.PRISMA], technologies: [TechTag.NEXTJS, TechTag.POSTGRES, TechTag.STRIPE, TechTag.PRISMA], status: ProjectStatus.COMPLETED, videoUrl: '/video/divulga-facil-dashboard.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'quackcoin-platform', name: 'QuackCoin Platform', title: 'QuackCoin Platform', description: 'Ecossistema crypto com 2FA, rewards diários, staking USDC, education CMS e cashback de afiliados.', categories: [ServiceCategory.SAAS], techs: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.GO], technologies: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.GO], status: ProjectStatus.COMPLETED, videoUrl: '/video/Quackcoin.mp4' },
  { slug: 'abitare-holding', name: 'Abitare Holding', title: 'Abitare Holding', description: 'Site corporativo para holding imobiliária italiana com animações, vídeo backgrounds e foco em conversão.', categories: [ServiceCategory.LANDING], techs: [TechTag.ASTRO, TechTag.TAILWIND], technologies: [TechTag.ASTRO, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/abitare-holding.mp4', countries: [DeliveryCountry.ITALIA] },
  { slug: 'health-technologies', name: 'Health Technologies', title: 'Health Technologies', description: 'Site institucional para empresa de IA na saúde com robótica cirúrgica, diagnósticos e smart pharmacy.', categories: [ServiceCategory.LANDING, ServiceCategory.AI], techs: [TechTag.NEXTJS, TechTag.TYPESCRIPT, TechTag.TAILWIND], technologies: [TechTag.NEXTJS, TechTag.TYPESCRIPT, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/HealthTechnologies.mp4', countries: [DeliveryCountry.ITALIA] },
  { slug: 'site-barato', name: 'SiteBaratoBR', title: 'SiteBaratoBR', description: 'Plataforma website builder onde usuários recebem código-fonte completo — pagamento único, sem assinatura.', categories: [ServiceCategory.SAAS], techs: [TechTag.NEXTJS, TechTag.STRIPE, TechTag.AWS_S3, TechTag.BULLMQ, TechTag.PRISMA], technologies: [TechTag.NEXTJS, TechTag.STRIPE, TechTag.AWS_S3, TechTag.BULLMQ, TechTag.PRISMA], status: ProjectStatus.COMPLETED, videoUrl: '/video/site-barato.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'doveabitarebene', name: 'Dove Abitare Bene', title: 'Dove Abitare Bene', description: 'Blog editorial italiano com Astro para performance, busca Pagefind e comentários Giscus.', categories: [ServiceCategory.LANDING], techs: [TechTag.ASTRO, TechTag.TAILWIND], technologies: [TechTag.ASTRO, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/doveabitarebene.mp4', countries: [DeliveryCountry.ITALIA] },
  { slug: 'calculadora-motoristas', name: 'Calculadora Motoristas', title: 'Calculadora Motoristas', description: 'Calculadora inteligente de custos para motoristas de app com charts interativos e insights de rentabilidade.', categories: [ServiceCategory.DASHBOARD], techs: [TechTag.NEXTJS, TechTag.RECHARTS, TechTag.TAILWIND], technologies: [TechTag.NEXTJS, TechTag.RECHARTS, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/calculadora-motoristas.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'thamy-shoes', name: 'Thamy Shoes', title: 'Thamy Shoes', description: 'Sistema de produção para fábrica de calçados com integração Bling ERP e geração de PDFs.', categories: [ServiceCategory.ERP], techs: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.BLING], technologies: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.BLING], status: ProjectStatus.COMPLETED, videoUrl: '/video/thamy-shoes.mp4', countries: [DeliveryCountry.BRASIL] },
  { slug: 'showroom', name: 'Design System Showroom', title: 'Design System Showroom', description: 'Preview interativo de design system com composição de temas em tempo real e validação WCAG.', categories: [ServiceCategory.SAAS, ServiceCategory.AI], techs: [TechTag.NEXTJS, TechTag.ZUSTAND, TechTag.TAILWIND], technologies: [TechTag.NEXTJS, TechTag.ZUSTAND, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/showroom.mp4' },
  { slug: 'corgnati-platform', name: 'Corgnati Platform', title: 'Corgnati Platform', description: 'Plataforma completa com CRM, gestão de projetos, faturamento e dashboard de clientes.', categories: [ServiceCategory.SAAS], techs: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.STRIPE], technologies: [TechTag.NEXTJS, TechTag.PRISMA, TechTag.STRIPE], status: ProjectStatus.COMPLETED, videoUrl: '/video/corgnati-platform.mp4' },
  { slug: 'techskillsthatpay', name: 'TechSkillsThatPay', title: 'TechSkillsThatPay', description: 'Blog tech multi-idioma (EN, PT-BR, ES, IT) com MDX, SEO hreflang, sitemaps e RSS.', categories: [ServiceCategory.LANDING], techs: [TechTag.NEXTJS, TechTag.MDX, TechTag.TAILWIND], technologies: [TechTag.NEXTJS, TechTag.MDX, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/techskillsthatpay.mp4' },
  { slug: 'apexcrypto', name: 'ApexCrypto', title: 'ApexCrypto', description: 'Landing page focada em conversão para plataforma de educação crypto com visuais impactantes.', categories: [ServiceCategory.LANDING], techs: [TechTag.NEXTJS, TechTag.NODE], technologies: [TechTag.NEXTJS, TechTag.NODE], status: ProjectStatus.COMPLETED, videoUrl: '/video/Apexcrypto-website.mp4' },
  { slug: 'apexswift', name: 'ApexSwift Dashboard', title: 'ApexSwift Dashboard', description: 'Dashboard financeiro data-heavy com charts interativos, gestão de usuários e interface escalável.', categories: [ServiceCategory.DASHBOARD], techs: [TechTag.NEXTJS, TechTag.GO, TechTag.TAILWIND], technologies: [TechTag.NEXTJS, TechTag.GO, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/ApexSwift-dashboard.mp4' },
  { slug: 'scoretube', name: 'ScoreTube Landing', title: 'ScoreTube Landing', description: 'Landing page de plataforma IA para avaliação de vídeos YouTube, focada em conversão.', categories: [ServiceCategory.LANDING, ServiceCategory.AI], techs: [TechTag.NEXTJS, TechTag.TAILWIND], technologies: [TechTag.NEXTJS, TechTag.TAILWIND], status: ProjectStatus.COMPLETED, videoUrl: '/video/Scoretube-landing.mp4' },
  { slug: 'ninekeys', name: 'NineKeys', title: 'NineKeys', description: 'Landing page premium para gestão de propriedades com tipografia refinada e vídeo imersivo.', categories: [ServiceCategory.LANDING], techs: [TechTag.HTML_CSS, TechTag.TYPESCRIPT], technologies: [TechTag.HTML_CSS, TechTag.TYPESCRIPT], status: ProjectStatus.COMPLETED, videoUrl: '/video/Ninekeys.mp4' },
  { slug: 'quackcoin-landing', name: 'QuackCoin Landing', title: 'QuackCoin Landing', description: 'Landing page de alta conversão para ecossistema de token utilitário com tokenomics e waitlist.', categories: [ServiceCategory.LANDING], techs: [TechTag.HTML_CSS, TechTag.TYPESCRIPT], technologies: [TechTag.HTML_CSS, TechTag.TYPESCRIPT], status: ProjectStatus.COMPLETED, videoUrl: '/video/quack-coin-landing-page.mp4' },
  { slug: 'c4ts', name: 'C4ts', title: 'C4ts', description: 'Knowledge base IA com orientação por problemas em 15 domínios frontend.', categories: [ServiceCategory.AI], techs: [TechTag.TYPESCRIPT], technologies: [TechTag.TYPESCRIPT], status: ProjectStatus.COMPLETED, videoUrl: '/video/c4ts.mp4' },
  { slug: 'suppleseller', name: 'SuppleSeller', title: 'SuppleSeller', description: 'E-commerce completo para nutrição esportiva com storefront, admin dashboard e fluxos de compra.', categories: [ServiceCategory.ECOMMERCE], techs: [TechTag.NEXTJS, TechTag.GO], technologies: [TechTag.NEXTJS, TechTag.GO], status: ProjectStatus.COMPLETED, videoUrl: '/video/Suppleseller.mp4' },
  { slug: 'passkey-dashboard', name: 'Passkey Dashboard', title: 'Passkey Dashboard', description: 'Dashboard de gestão de campanhas com workspaces, assets criativos e filtros avançados.', categories: [ServiceCategory.DASHBOARD], techs: [TechTag.NEXTJS, TechTag.TYPESCRIPT], technologies: [TechTag.NEXTJS, TechTag.TYPESCRIPT], status: ProjectStatus.COMPLETED, videoUrl: '/video/Passkey-dashboard.mp4' },
  { slug: 'zenminder', name: 'ZenMinder', title: 'ZenMinder', description: 'Plataforma de produtividade com auth, lembretes, verificação por telefone e marketplace de recompensas.', categories: [ServiceCategory.SAAS], techs: [TechTag.REACT, TechTag.FIREBASE], technologies: [TechTag.REACT, TechTag.FIREBASE], status: ProjectStatus.COMPLETED, videoUrl: '/video/Zenminder.mp4' },
  { slug: 'personal-website', name: 'Personal Website', title: 'Personal Website', description: 'Portfolio interativo de desenvolvedor com seções animadas, showcase de projetos e formulário de contato.', categories: [ServiceCategory.LANDING], techs: [TechTag.NEXTJS, TechTag.REACT], technologies: [TechTag.NEXTJS, TechTag.REACT], status: ProjectStatus.COMPLETED, videoUrl: '/video/Personal-Resume-Website.mp4' },
  { slug: 'cognuscraft', name: 'Cognuscraft', title: 'Cognuscraft', description: 'Landing page para empresa de IA, destacando missão e produtos flagship.', categories: [ServiceCategory.LANDING, ServiceCategory.AI], techs: [TechTag.HTML_CSS], technologies: [TechTag.HTML_CSS], status: ProjectStatus.COMPLETED, videoUrl: '/video/Cognuscraft.mp4' },
]

export const portfolioProjects: PortfolioProject[] = _portfolioProjectsRaw.map(p => ({
  ...p,
  description: _portfolioDescriptions.get(p.slug) ?? p.description,
}))

export const testimonials: Testimonial[] = [
  {
    id: '1',
    content: 'A SystemForge transformou nossa clínica. O sistema de prontuário eletrônico que desenvolveram é intuitivo e reduziu em 40% o tempo de atendimento administrativo. Recomendo sem hesitar.',
    author: 'Mariana Costa',
    role: 'CEO',
    company: 'ClinicaPro Saúde Digital',
    avatarUrl: '/images/testimonials/mariana-costa.png',
  },
  {
    id: '2',
    content: 'Precisávamos de um marketplace completo em 3 meses. A SystemForge entregou em 10 semanas, com qualidade de produto. O diferencial é que eles pensam no negócio, não só no código.',
    author: 'Rafael Oliveira',
    role: 'Founder',
    company: 'Arte & Ofício Marketplace',
    avatarUrl: '/images/testimonials/rafael-oliveira.png',
  },
  {
    id: '3',
    content: 'Avevamo bisogno di una piattaforma SaaS su misura per il mercato italiano. SystemForge ha capito subito le nostre esigenze e ha consegnato un prodotto eccellente nei tempi previsti.',
    author: 'Lucia Ferrari',
    role: 'Direttrice Operativa',
    company: 'FreelancerHub Italia',
    avatarUrl: '/images/testimonials/lucia-ferrari.png',
  },
  {
    id: '4',
    content: 'O dashboard de logística que a SystemForge construiu substituiu 3 ferramentas separadas. Visibilidade em tempo real e relatórios que antes levavam horas para gerar, agora estão a 1 clique.',
    author: 'Carlos Mendes',
    role: 'Diretor de TI',
    company: 'LogiView Transportes',
    avatarUrl: '/images/testimonials/carlos-mendes.png',
  },
  {
    id: '5',
    content: 'Minha loja virtual ficou exatamente como eu imaginava. Rápida, bonita e fácil de usar tanto para mim na gestão quanto para as clientes na hora de comprar. Vendas aumentaram 60% no primeiro mês.',
    author: 'Ana Paula Lima',
    role: 'Proprietária',
    company: 'Vitrine Chic Moda',
    avatarUrl: '/images/testimonials/ana-paula-lima.png',
  },
  {
    id: '6',
    content: 'A integração entre nosso ERP legado e os canais de venda era um pesadelo. A SystemForge criou uma API robusta que hoje processa 50 mil pedidos/dia sem incidentes. Suporte impecável.',
    author: 'Thiago Souza',
    role: 'CTO',
    company: 'SyncBridge Integrações',
    avatarUrl: '/images/testimonials/thiago-souza.png',
  },
]
