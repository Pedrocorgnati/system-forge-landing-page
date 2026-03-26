/**
 * lib/data/testimonials.ts
 * Depoimentos de clientes da SystemForge.
 * Dados fictícios plausíveis — substituir por dados reais antes do deploy.
 */
import type { Testimonial } from '../types'

const rawTestimonials = [
  {
    name: 'Mariana Costa',
    role: 'CEO',
    company: 'ClinicaPro Saúde Digital',
    text: 'A SystemForge transformou nossa clínica. O sistema de prontuário eletrônico que desenvolveram é intuitivo e reduziu em 40% o tempo de atendimento administrativo. Recomendo sem hesitar.',
    avatarUrl: '/images/testimonials/mariana-costa.png',
    projectSlug: 'clinica-pro',
  },
  {
    name: 'Rafael Oliveira',
    role: 'Founder',
    company: 'Arte & Ofício Marketplace',
    text: 'Precisávamos de um marketplace completo em 3 meses. A SystemForge entregou em 10 semanas, com qualidade de produto. O diferencial é que eles pensam no negócio, não só no código.',
    avatarUrl: '/images/testimonials/rafael-oliveira.png',
    projectSlug: 'marketplace-artesanato',
  },
  {
    name: 'Lucia Ferrari',
    role: 'Direttrice Operativa',
    company: 'FreelancerHub Italia',
    text: 'Avevamo bisogno di una piattaforma SaaS su misura per il mercato italiano. SystemForge ha capito subito le nostre esigenze e ha consegnato un prodotto eccellente nei tempi previsti.',
    avatarUrl: '/images/testimonials/lucia-ferrari.png',
    projectSlug: 'freelancer-hub',
  },
  {
    name: 'Carlos Mendes',
    role: 'Diretor de TI',
    company: 'LogiView Transportes',
    text: 'O dashboard de logística que a SystemForge construiu substituiu 3 ferramentas separadas. Visibilidade em tempo real e relatórios que antes levavam horas para gerar, agora estão a 1 clique.',
    avatarUrl: '/images/testimonials/carlos-mendes.png',
    projectSlug: 'dashboard-logistica',
  },
  {
    name: 'Ana Paula Lima',
    role: 'Proprietária',
    company: 'Vitrine Chic Moda',
    text: 'Minha loja virtual ficou exatamente como eu imaginava. Rápida, bonita e fácil de usar tanto para mim na gestão quanto para as clientes na hora de comprar. Vendas aumentaram 60% no primeiro mês.',
    avatarUrl: '/images/testimonials/ana-paula-lima.png',
    projectSlug: 'ecommerce-moda-feminina',
  },
  {
    name: 'Thiago Souza',
    role: 'CTO',
    company: 'SyncBridge Integrações',
    text: 'A integração entre nosso ERP legado e os canais de venda era um pesadelo. A SystemForge criou uma API robusta que hoje processa 50 mil pedidos/dia sem incidentes. Suporte impecável.',
    avatarUrl: '/images/testimonials/thiago-souza.png',
    projectSlug: 'integracao-erp-ecommerce',
  },
]

export const testimonials: Testimonial[] = rawTestimonials.map((item, index) => ({
  id: String(index + 1),
  author: item.name,
  content: item.text,
  ...item,
}))
