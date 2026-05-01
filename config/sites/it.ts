/**
 * config/sites/it.ts
 * Configuração do site italiano (systemforge.it)
 */
import type { SiteConfig } from '../types'

const IT_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://systemforge.it'

export const itConfig: SiteConfig = {
  locale: 'it-IT',
  htmlLang: 'it',
  ogLocale: 'it_IT',
  siteName: 'SystemForge',
  domain: 'systemforge.it',
  url: IT_URL,
  tagline: 'Software su misura per trasformare il tuo business',
  description:
    'Sviluppiamo software su misura: SaaS, app mobile, landing page, e-commerce, dashboard e automazioni con IA. Team specializzato, consegna in settimane.',
  author: 'SystemForge',
  email: 'contatto@systemforge.it',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_IT ?? '+393508751885',
  calendly: '',
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://corgnati.com/quote'}?locale=it-IT`,
  address: 'Milano, Italia',
  compliance: 'GDPR',
  currency: 'EUR',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Servizi', href: '/servizi' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contatto', href: '/#contatto' },
  ],
  seo: {
    title: 'SystemForge | Sviluppo Software su Misura',
    description:
      'Sviluppiamo software su misura: SaaS, app mobile, landing page, e-commerce, dashboard e automazioni con IA.',
    titleTemplate: '%s | SystemForge',
    ogImage: '/og/og-it.png',
  },
  routes: {
    home: '/',
    services: '/servizi',
    service: (slug: string) => `/servizi/${slug}`,
    portfolio: '/portfolio',
    portfolioProject: (slug: string) => `/portfolio/${slug}`,
    blog: '/blog',
    blogPost: (slug: string) => `/blog/${slug}`,
    blogPage: (n: number) => `/blog/page/${n}`,
    blogCategory: (cat: string) => `/blog/categorie/${cat}`,
    blogTag: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
    privacy: '/privacy',
    newsletterConfirmed: '/newsletter/confermato',
    advisor: '/consulente',
    contact: '/#contatto',
  },
  newsletter: {
    workerUrl: process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_IT
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL  // fallback legado
      ?? '',
    doubleOptIn: true, // GDPR obrigatório
  },
  newsletterApiUrl:
    process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_IT
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL
      ?? '',
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
}
