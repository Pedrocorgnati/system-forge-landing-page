/**
 * config/sites/it.ts
 * Configuração do site italiano (systemforge.it)
 */
import type { SiteConfig } from '../types'

const IT_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://systemforge.it'

export const itConfig: SiteConfig = {
  locale: 'it-IT',
  htmlLang: 'it-IT',
  ogLocale: 'it_IT',
  siteName: 'SystemForge',
  domain: 'systemforge.it',
  url: IT_URL,
  tagline: 'Software su misura per trasformare il tuo business',
  description:
    'Sviluppiamo software su misura: SaaS, app mobile, landing page, e-commerce, dashboard e automazioni con IA. Team specializzato, consegna in settimane.',
  author: 'SystemForge',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contatto@systemforge.it',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_IT ?? '+393508751885',
  calendly: '',
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://www.systemforgedashboard.com/quote'}?locale=it-IT`,
  address: 'Milano, Italia',
  compliance: 'GDPR',
  currency: 'EUR',
  oidc: {
    clientId: 'systemforge-it',
    redirectUri: 'https://systemforge.it/auth/callback',
    authority: 'https://www.systemforgedashboard.com',
    uiLocale: 'it-IT',
  },
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Servizi', href: '/servicos' },
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
  // Slugs fisicos pt-BR: o app/ so gera rotas PT. Slugs localizados
  // (/servizi, /blog/categorie) pendem da feature i18n-triple-market;
  // ate la, apontar para as rotas reais evita 404 na navegacao.
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
    privacy: '/privacy',
    newsletterConfirmed: '/newsletter/confirmado',
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
