// Tipos e enums compartilhados — SystemForge Landing Page

export enum ServiceCategory {
  SAAS = 'saas',
  MOBILE = 'mobile',
  LANDING = 'landing',
  ECOMMERCE = 'ecommerce',
  DASHBOARD = 'dashboard',
  API = 'api',
  AI = 'automacao-com-ia',
  MARKETPLACE = 'marketplace',
  ERP = 'erp',
  CHATBOT = 'chatbot',
  CONSULTORIA = 'consultoria',
}

export enum TechTag {
  NEXTJS = 'next.js',
  REACT = 'react',
  TYPESCRIPT = 'typescript',
  NODEJS = 'node.js',
  PYTHON = 'python',
  POSTGRES = 'postgresql',
  SUPABASE = 'supabase',
  TAILWIND = 'tailwind',
  PRISMA = 'prisma',
  REACT_NATIVE = 'react-native',
  FLUTTER = 'flutter',
  OPENAI = 'openai',
  STRIPE = 'stripe',
}

export enum ConversionAction {
  WHATSAPP = 'whatsapp',
  CALENDLY = 'calendly',
  BUDGET_ENGINE = 'budget_engine',
}

export enum ProjectStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export interface CTAConfig {
  action: ConversionAction
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'ghost'
  icon?: string
}

export interface PortfolioProject {
  id: string
  title: string
  description: string
  category: ServiceCategory
  techs: TechTag[]
  status: ProjectStatus
  imageUrl?: string
  externalUrl?: string
  featured?: boolean
}

export interface Service {
  slug: string
  name: string
  description: string
  longDescription: string
  icon: string
  category: ServiceCategory
}

export interface Testimonial {
  id: string
  content: string
  author: string
  role: string
  company: string
  avatarUrl?: string
}

export interface ArticleFrontmatter {
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  category: string
  coverImage?: string
  readingTime?: number
  slug: string
}
