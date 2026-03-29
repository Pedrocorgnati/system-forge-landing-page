/**
 * config/sites/es.ts
 * Configuração do site espanhol (systemforge.es)
 */
import type { SiteConfig } from '../types'

const ES_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://systemforge.es'

export const esConfig: SiteConfig = {
  locale: 'es-ES',
  htmlLang: 'es',
  ogLocale: 'es_ES',
  siteName: 'SystemForge',
  domain: 'systemforge.es',
  url: ES_URL,
  tagline: 'Software a medida para transformar tu negocio',
  description:
    'Desarrollamos software a medida: SaaS, apps móviles, landing pages, e-commerce, dashboards y automatizaciones con IA. Equipo especializado, entrega en semanas.',
  author: 'SystemForge',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hola@systemforge.es',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '+393508751885',
  calendly: '',
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://www.corgnati.com/quote'}?locale=es-ES`,
  address: 'España / Latinoamérica',
  compliance: 'GDPR',
  currency: 'EUR',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicios' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contacto', href: '/#contacto' },
  ],
  seo: {
    title: 'SystemForge | Desarrollo de Software a Medida',
    description:
      'Desarrollamos software a medida: SaaS, apps móviles, landing pages, e-commerce, dashboards y automatizaciones con IA.',
    titleTemplate: '%s | SystemForge',
    ogImage: '/og/og-es.png',
  },
  routes: {
    home: '/',
    services: '/servicios',
    service: (slug: string) => `/servicios/${slug}`,
    portfolio: '/portfolio',
    portfolioProject: (slug: string) => `/portfolio/${slug}`,
    blog: '/blog',
    blogPost: (slug: string) => `/blog/${slug}`,
    blogPage: (n: number) => `/blog/page/${n}`,
    blogCategory: (cat: string) => `/blog/categoria/${cat}`,
    blogTag: (tag: string) => `/blog/tag/${encodeURIComponent(tag)}`,
    privacy: '/privacidad',
    newsletterConfirmed: '/newsletter/confirmado',
    advisor: '/asesor',
    contact: '/#contacto',
  },
  newsletter: {
    workerUrl: process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL  // fallback legado
      ?? '',
    doubleOptIn: true, // GDPR obrigatório
  },
  newsletterApiUrl:
    process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES
      ?? process.env.NEXT_PUBLIC_NEWSLETTER_API_URL
      ?? '',
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
}
