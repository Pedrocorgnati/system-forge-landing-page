/**
 * lib/data/services.config.ts
 * Dados detalhados de páginas de serviço (/servicos/[slug]).
 *
 * Expandido em module-6-portfolio-services/TASK-1.
 */
import { ServiceCategory } from '../types'
import type { ServicePageData } from '../types'
import { portfolioProjects } from './portfolio'

export const servicesConfig: ServicePageData[] = [
  {
    category: ServiceCategory.SAAS,
    title: 'Desenvolvimento de SaaS e Plataformas Web',
    description:
      'Construímos plataformas SaaS escaláveis do zero — da arquitetura ao deploy — com foco em crescimento contínuo e experiência do usuário.',
    longDescription:
      'Transformamos sua ideia em uma plataforma SaaS completa, pronta para escalar. Da concepção à produção, entregamos sistemas multi-tenant com autenticação robusta, billing integrado (Stripe), onboarding guiado e painéis personalizados por role. Nossa metodologia SystemForge garante que você lance em semanas, não meses, com qualidade enterprise desde o primeiro deploy. Você foca no produto — nós resolvemos a arquitetura, performance e segurança.',
    keywords: [
      'desenvolvimento saas',
      'plataforma web customizada',
      'software como serviço',
      'sistema multi-tenant',
      'mvp saas',
      'startup saas brasil',
      'saas b2b',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.SAAS),
    ),
  },
  {
    category: ServiceCategory.MOBILE,
    title: 'Desenvolvimento de Aplicativos Mobile',
    description:
      'Apps iOS e Android nativos e multiplataforma com React Native — performance nativa, publicação nas lojas e atualizações contínuas.',
    longDescription:
      'Desenvolvemos aplicativos mobile que os usuários realmente usam. Utilizamos React Native para entregar performance nativa em iOS e Android com uma única base de código, reduzindo custos e acelerando entregas. Do protótipo à publicação nas lojas, cuidamos de push notifications, onboarding, autenticação biométrica e integrações com APIs. Cada app é projetado com foco em retenção: UX limpa, carregamento rápido e fluxos que convertem visitantes em usuários ativos.',
    keywords: [
      'desenvolvimento app mobile',
      'aplicativo ios android',
      'react native',
      'app empresarial',
      'desenvolvimento mobile brasil',
      'app multiplataforma',
      'app b2b',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.MOBILE),
    ),
  },
  {
    category: ServiceCategory.MARKETPLACE,
    title: 'Desenvolvimento de Marketplace',
    description:
      'Plataformas com múltiplos vendedores, pagamentos, avaliações e gestão de disputas — prontas para operar e escalar.',
    longDescription:
      'Criamos marketplaces B2B e B2C completos, com gestão de vendedores, catálogos de produtos, sistema de pagamentos split, avaliações, cupons e painel administrativo. Nossa arquitetura é desenhada para volume: suporta picos de tráfego sem queda de performance. Integramos com os principais gateways de pagamento do Brasil e cuidamos de toda a complexidade fiscal e logística. Você lança um marketplace funcional — nós garantimos que a tecnologia não seja o gargalo do seu crescimento.',
    keywords: [
      'desenvolvimento marketplace',
      'plataforma de vendas online',
      'marketplace b2b b2c',
      'e-commerce multi-vendedor',
      'plataforma marketplace brasil',
      'marketplace customizado',
      'sistema de marketplace',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.MARKETPLACE),
    ),
  },
  {
    category: ServiceCategory.AI,
    title: 'Automação com Inteligência Artificial',
    description:
      'Sistemas inteligentes com GPT-4, análise de documentos, geração de conteúdo e NLP — integrando IA à sua operação real.',
    longDescription:
      'Integramos inteligência artificial à sua operação de forma prática e com ROI mensurável. Desenvolvemos sistemas com GPT-4, Claude e modelos open-source para automação de atendimento, análise de documentos, geração de relatórios e classificação de dados. Não entregamos demos — entregamos soluções que rodam em produção, reduzem custo operacional e escalam com o seu negócio. Da prototipagem ao deploy em nuvem, acompanhamos cada etapa para garantir que a IA realmente funcione no seu contexto.',
    keywords: [
      'automacao com ia',
      'inteligencia artificial empresarial',
      'chatgpt api',
      'llm para empresas',
      'automacao ia brasil',
      'ai para negocios',
      'integracao openai',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.AI),
    ),
  },
  {
    category: ServiceCategory.BOTS,
    title: 'Bots e Automações de Processos',
    description:
      'Bots WhatsApp/Telegram, automação de processos repetitivos, scraping e integrações via n8n/Zapier — 24h funcionando.',
    longDescription:
      'Automatizamos processos que consomem tempo da sua equipe sem agregar valor. Desenvolvemos bots para WhatsApp e Telegram com fluxos conversacionais inteligentes, automações RPA para tarefas repetitivas, pipelines de dados com n8n e integrações entre sistemas que não se falam nativamente. Cada automação é documentada, monitorada e mantida — para que você tenha confiança de que o processo roda sem supervisão. O resultado: equipe focada no que importa, custos reduzidos e operação escalável.',
    keywords: [
      'bot whatsapp',
      'automacao de processos',
      'rpa',
      'chatbot empresarial',
      'integracao de sistemas',
      'automacao n8n',
      'bot telegram',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.BOTS),
    ),
  },
  {
    category: ServiceCategory.LANDING_PAGE,
    title: 'Landing Pages de Alta Conversão',
    description:
      'Sites institucionais e landing pages focadas em conversão, com blog, SEO técnico avançado e performance Lighthouse 90+.',
    longDescription:
      'Criamos landing pages que convertem visitantes em clientes — e clientes em fãs. Cada página é desenhada com copy persuasivo, hierarquia visual clara, CTAs testados e carregamento ultrarrápido (LCP < 2.5s). Implementamos SEO técnico completo: Schema.org, sitemap, canonical, meta tags e estrutura de headings otimizada para ranquear no Google. Para blogs e sites institucionais, entregamos sistema de conteúdo integrado e painel de edição simples. Você não precisa depender de um desenvolvedor para cada atualização.',
    keywords: [
      'landing page profissional',
      'pagina de vendas',
      'landing page alta conversao',
      'criacao site empresa',
      'site institucional',
      'landing page seo',
      'criacao landing page brasil',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.LANDING_PAGE),
    ),
  },
  {
    category: ServiceCategory.ECOMMERCE,
    title: 'Lojas Virtuais e E-commerce',
    description:
      'Lojas virtuais com catálogo, carrinho, pagamento, estoque e painel administrativo — do MVP à operação com alto volume.',
    longDescription:
      'Desenvolvemos lojas virtuais que vendem de verdade. Construímos e-commerces customizados do zero ou evoluímos soluções existentes como Shopify e WooCommerce para o próximo nível. Cada loja entregue tem catálogo gerenciável, checkout otimizado para mobile, integração com gateways de pagamento brasileiros, controle de estoque e painel administrativo intuitivo. Aplicamos práticas de conversão em cada detalhe: do fluxo de compra ao e-mail de recuperação de carrinho. Você vende mais — com menos fricção para o cliente.',
    keywords: [
      'desenvolvimento loja virtual',
      'e-commerce customizado',
      'shopify desenvolvimento',
      'woocommerce',
      'loja online brasil',
      'desenvolvimento ecommerce',
      'ecommerce b2c',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.ECOMMERCE),
    ),
  },
  {
    category: ServiceCategory.DASHBOARD,
    title: 'Dashboards e Painéis B2B',
    description:
      'Painéis analíticos com gráficos em tempo real, filtros avançados, exports e KPIs customizados para decisões baseadas em dados.',
    longDescription:
      'Transformamos dados brutos em insights acionáveis com dashboards B2B de alta performance. Desenvolvemos painéis com gráficos em tempo real, tabelas com filtros avançados, exports para Excel/PDF e permissões granulares por role. Nossa abordagem conecta fontes diversas — banco de dados, APIs externas, planilhas — em uma interface unificada que a equipe realmente usa. O resultado é um centro de controle que reduz o tempo de análise, acelera decisões e mostra com clareza onde focar os esforços.',
    keywords: [
      'dashboard empresarial',
      'painel de controle b2b',
      'analytics dashboard',
      'bi personalizado',
      'dashboard saas',
      'painel administrativo',
      'dashboard react',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.DASHBOARD),
    ),
  },
  {
    category: ServiceCategory.API,
    title: 'APIs e Integrações de Sistemas',
    description:
      'APIs RESTful e GraphQL, webhooks, integrações ERP/CRM e middleware de dados — conectando sistemas que precisam trabalhar juntos.',
    longDescription:
      'Construímos a camada de integração que faz seus sistemas conversarem. Desenvolvemos APIs RESTful e GraphQL bem documentadas, webhooks confiáveis, middleware de transformação de dados e conectores para ERP, CRM, ERPs fiscais e plataformas de terceiros. Cada API entregue tem autenticação robusta, rate limiting, logs de auditoria e documentação OpenAPI. Para integrações legadas, criamos adaptadores que modernizam a comunicação sem exigir refatoração do sistema existente. Você ganha interoperabilidade real — sem gambiarras.',
    keywords: [
      'desenvolvimento api',
      'integracao de sistemas',
      'rest api',
      'webhook',
      'erp integracao',
      'api gateway',
      'middleware dados',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.API),
    ),
  },
  {
    category: ServiceCategory.DESKTOP,
    title: 'Aplicações Desktop',
    description:
      'Aplicativos desktop multiplataforma com Electron, suporte offline, atualizações automáticas e integração com hardware local.',
    longDescription:
      'Desenvolvemos aplicações desktop que rodam em Windows, macOS e Linux a partir de uma única base de código com Electron. Nossos apps suportam operação offline, sincronização em background, atualizações automáticas e integração com periféricos locais como impressoras, leitores de código de barras e balanças. Para sistemas internos e operações industriais que precisam de confiabilidade acima de conectividade, o desktop é a escolha certa — e entregamos isso com a qualidade e velocidade de desenvolvimento web moderno.',
    keywords: [
      'aplicativo desktop windows',
      'electron app',
      'software desktop empresarial',
      'sistema interno',
      'app desktop multiplataforma',
      'software offline',
      'desenvolvimento electron',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.DESKTOP),
    ),
  },
  {
    category: ServiceCategory.GESTAO,
    title: 'Sistemas de Gestão Setorial',
    description:
      'Sistemas verticais para saúde, educação, imobiliário, jurídico e varejo — com lógica de negócio específica do seu setor.',
    longDescription:
      'Construímos sistemas de gestão que entendem as regras do seu setor — não soluções genéricas que você precisa adaptar. Para saúde: prontuário eletrônico, agendamento e faturamento. Para educação: matrícula, frequência e comunicação. Para imobiliário: CRM, contratos e relatórios. Para jurídico: gestão de processos, prazos e clientes. Cada sistema é desenvolvido em parceria com quem opera o negócio, garantindo que a ferramenta reflita os processos reais, não o contrário. O resultado é adoção natural pela equipe e ganhos de eficiência desde o primeiro dia.',
    keywords: [
      'sistema de gestao',
      'erp customizado',
      'software para clinicas',
      'sistema para escolas',
      'gestao empresarial',
      'software setorial',
      'sistema vertical',
    ],
    relatedProjects: portfolioProjects.filter((p) =>
      p.categories.includes(ServiceCategory.GESTAO),
    ),
  },
]

/** Busca config de serviço por categoria */
export function getServiceConfig(category: ServiceCategory): ServicePageData | undefined {
  return servicesConfig.find((s) => s.category === category)
}
