// Tipos e enums compartilhados — SystemForge Landing Page

export const ServiceCategory = {
  SAAS: 'saas',
  MOBILE: 'aplicativo-mobile',
  MARKETPLACE: 'marketplace',
  AI: 'automacao-com-ia',
  BOTS: 'bots-automacoes',
  CHATBOT: 'bots-automacoes',
  LANDING: 'landing-page',
  LANDING_PAGE: 'landing-page',
  ECOMMERCE: 'e-commerce',
  DASHBOARD: 'dashboard-b2b',
  API: 'api-integracoes',
  DESKTOP: 'desktop',
  GESTAO: 'gestao-setorial',
  ERP: 'erp',
  CONSULTORIA: 'consultoria',
} as const

export type ServiceCategory = typeof ServiceCategory[keyof typeof ServiceCategory]

export const TechTag = {
  NEXTJS: 'next.js',
  REACT: 'react',
  TYPESCRIPT: 'typescript',
  NODE: 'node.js',
  NODEJS: 'node.js',
  PYTHON: 'python',
  POSTGRES: 'postgresql',
  SUPABASE: 'supabase',
  TAILWIND: 'tailwind',
  PRISMA: 'prisma',
  REACT_NATIVE: 'react-native',
  FLUTTER: 'flutter',
  OPENAI: 'openai',
  STRIPE: 'stripe',
  CLAUDE_AI: 'claude',
  CHARTJS: 'chart.js',
  RECHARTS: 'recharts',
  TWILIO: 'twilio',
  INNGEST: 'inngest',
  KIWIFY: 'kiwify',
  GO: 'go',
  HTML_CSS: 'html/css',
  ASTRO: 'astro',
  MDX: 'mdx',
  AWS_S3: 'aws s3',
  BULLMQ: 'bullmq',
  ZUSTAND: 'zustand',
  BLING: 'bling',
  FIREBASE: 'firebase',
  FASTAPI: 'fastapi',
  ELECTRON: 'electron',
} as const

export type TechTag = typeof TechTag[keyof typeof TechTag]

export enum ConversionAction {
  WHATSAPP = 'whatsapp',
  CALENDLY = 'calendly',
  BUDGET_ENGINE = 'budget_engine',
}

export const ProjectStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
  PRODUCAO: 'completed',
  DESENVOLVIMENTO: 'in_progress',
} as const

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus]

export const DeliveryCountry = {
  BRASIL: 'Brasil',
  ITALIA: 'Italia',
} as const

export type DeliveryCountry = typeof DeliveryCountry[keyof typeof DeliveryCountry]

export interface CTAConfig {
  action: ConversionAction
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'ghost'
  icon?: string
}

export interface PortfolioProject {
  id?: string
  slug: string
  name?: string
  title?: string
  description: string
  category?: ServiceCategory
  categories: ServiceCategory[]
  techs?: TechTag[]
  technologies: TechTag[]
  countries?: DeliveryCountry[]
  status: ProjectStatus
  imageUrl?: string
  coverImage?: string
  videoUrl?: string
  externalUrl?: string
  url?: string
  featured?: boolean
  suggested?: boolean
  filters?: string[]
}

export type ServiceFilterGroup = 'produto' | 'mobile-ia' | 'dados'

export interface Service {
  slug: string
  name: string
  description: string
  longDescription: string
  icon: string
  category: ServiceCategory
  deliverables?: string[]
  techHints?: string[]
  deliveryWeeks?: string
  filterGroup?: ServiceFilterGroup
}

export interface ServiceData {
  slug: ServiceCategory
  label?: string
  name?: string
  description: string
  longDescription?: string
  icon: string
  category?: ServiceCategory
}

export interface ServicePageData {
  category: ServiceCategory
  title: string
  description: string
  longDescription: string
  keywords: string[]
  relatedProjects: PortfolioProject[]
}

export interface Testimonial {
  id: string
  content: string
  text?: string
  author: string
  name?: string
  role: string
  company: string
  avatarUrl?: string
  projectSlug?: string
}

export interface ArticleFrontmatter {
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  category?: string
  coverImage: string
  readingTime?: number
  slug: string
  relatedService?: ServiceCategory
}

export interface PageMetadataConfig {
  title: string
  description: string
  path: string
  ogImage?: string
  noIndex?: boolean
}
