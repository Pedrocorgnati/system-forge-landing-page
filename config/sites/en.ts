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
  email: 'hello@systemforgesoftware.com',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '+5512934859127',
  calendly: '',
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://www.corgnati.com/quote'}?locale=en-US`,
  address: 'Remote, United States',
  compliance: 'CAN-SPAM',
  currency: 'USD',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
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
  routes: {
    home: '/',
    services: '/services',
    service: (slug: string) => `/services/${slug}`,
    portfolio: '/portfolio',
    portfolioProject: (slug: string) => `/portfolio/${slug}`,
    blog: '/blog',
    blogPost: (slug: string) => `/blog/${slug}`,
    blogPage: (n: number) => `/blog/page/${n}`,
    blogCategory: (cat: string) => `/blog/category/${cat}`,
    blogTag: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
    privacy: '/privacy',
    newsletterConfirmed: '/newsletter/confirmed',
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
