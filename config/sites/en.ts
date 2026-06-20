/**
 * config/sites/en.ts
 * Configuração do site internacional (systemforgesoftware.com)
 */
import type { SiteConfig } from '../types'

const EN_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://systemforgesoftware.com'

export const enConfig: SiteConfig = {
  locale: 'en',
  htmlLang: 'en',
  ogLocale: 'en_US',
  siteName: 'SystemForge Software',
  domain: 'systemforgesoftware.com',
  url: EN_URL,
  tagline: 'Custom software to transform your business',
  description:
    'We build custom software: SaaS, mobile apps, landing pages, e-commerce, dashboards and AI automations. Specialized team, delivery in weeks.',
  author: 'SystemForge',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@systemforgesoftware.com',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_EN ?? '+17865891052',
  calendly: '',
  // Orcamento entra pela HOME (raiz) do dashboard, nao mais por /quote: origem por host,
  // idioma por ?locale=. Rotas antigas /quote (200) e /get-ai-quote (redirect) nunca 404 (task 013).
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://www.systemforgedashboard.com/'}?locale=en-US`,
  address: 'Remote, United States',
  compliance: 'CAN-SPAM',
  currency: 'USD',
  oidc: {
    clientId: 'systemforge-en',
    redirectUri: 'https://systemforgesoftware.com/auth/callback',
    authority: 'https://www.systemforgedashboard.com',
    uiLocale: 'en',
  },
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/servicos' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/#contact' },
  ],
  seo: {
    title: 'SystemForge Software | Custom Software Development',
    description:
      'We build custom software: SaaS, mobile apps, landing pages, e-commerce, dashboards and AI automations.',
    titleTemplate: '%s | SystemForge Software',
    ogImage: '/og/og-en.png',
  },
  // Slugs fisicos pt-BR: o app/ so gera rotas PT. Slugs localizados
  // (/services, /blog/category) pendem da feature i18n-triple-market;
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
    advisor: '/advisor',
    contact: '/#contact',
  },
  newsletter: {
    workerUrl: process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_EN
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL  // fallback legado
      ?? '',
    doubleOptIn: false,
  },
  newsletterApiUrl:
    process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_EN
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL
      ?? '',
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
}
