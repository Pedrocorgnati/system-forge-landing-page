/**
 * config/sites/br.ts
 * Configuração do site brasileiro (forjadesistemas.com.br)
 */
import type { SiteConfig } from '../types'

const BR_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://forjadesistemas.com.br'

export const brConfig: SiteConfig = {
  locale: 'pt-BR',
  htmlLang: 'pt-BR',
  ogLocale: 'pt_BR',
  siteName: 'Forja de Sistemas',
  domain: 'forjadesistemas.com.br',
  url: BR_URL,
  tagline: 'Software sob medida para transformar negócios',
  description:
    'Desenvolvemos software sob medida: SaaS, apps mobile, landing pages, e-commerce, dashboards e automações com IA. Time especializado, entrega em semanas.',
  author: 'SystemForge',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@forjadesistemas.com.br',
  // Per-locale: NEXT_PUBLIC_WHATSAPP_NUMBER (sem sufixo) era compartilhado entre
  // todos os builds e fazia BR/IT/EN/ES caírem no mesmo número. Cada locale tem
  // sua própria env var; o fallback hardcoded vence se a env não estiver setada.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_BR ?? '+5512934859127',
  calendly: '',
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://corgnati.com/quote'}?locale=pt-BR`,
  address: 'Curitiba/PR, Brasil',
  compliance: 'LGPD',
  currency: 'BRL',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Início', href: '/' },
    { label: 'Serviços', href: '/servicos' },
    { label: 'Portfólio', href: '/portfolio' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contato', href: '/#contato' },
  ],
  seo: {
    title: 'Forja de Sistemas | Desenvolvimento de Software sob Medida',
    description:
      'Desenvolvemos software sob medida: SaaS, apps mobile, landing pages, e-commerce, dashboards e automações com IA.',
    titleTemplate: '%s | Forja de Sistemas',
    ogImage: '/og/og-br.png',
  },
  routes: {
    home: '/',
    services: '/servicos',
    service: (slug: string) => `/servicos/${slug}`,
    portfolio: '/portfolio',
    portfolioProject: (slug: string) => `/portfolio/${slug}`,
    blog: '/blog',
    blogPost: (slug: string) => `/blog/${slug}`,
    blogPage: (n: number) => `/blog/page/${n}`,
    blogCategory: (cat: string) => `/blog/categoria/${cat}`,
    blogTag: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
    privacy: '/privacidade',
    newsletterConfirmed: '/newsletter/confirmado',
    advisor: '/conselheiro',
    contact: '/#contato',
  },
  newsletter: {
    workerUrl: process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_BR
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL  // fallback legado
      ?? '',
    doubleOptIn: false,
  },
  newsletterApiUrl:
    process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_BR
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL
      ?? '',
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
}
