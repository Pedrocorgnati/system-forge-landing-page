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
  // ES usa a linha WhatsApp da ITALIA (decisao do operador 2026-06-20): leads
  // espanhois caem no mesmo atendimento italiano. A mensagem pre-preenchida fica
  // em espanhol (cta.ts / WhatsAppStickyButton localizam por locale).
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_ES ?? '+393508751885',
  calendly: '',
  // Orcamento entra pela HOME (raiz) do dashboard, nao mais por /quote: origem por host,
  // idioma por ?locale=. Rotas antigas /quote (200) e /get-ai-quote (redirect) nunca 404 (task 013).
  budgetEngine: `${process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL ?? 'https://www.systemforgedashboard.com/'}?locale=es-ES`,
  address: 'España / Latinoamérica',
  compliance: 'GDPR',
  currency: 'EUR',
  oidc: {
    clientId: 'systemforge-es',
    redirectUri: 'https://systemforge.es/auth/callback',
    authority: 'https://www.systemforgedashboard.com',
    uiLocale: 'es-ES',
  },
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/systemforge',
    github: 'https://github.com/Pedrocorgnati/system-forge-landing-page',
    instagram: 'https://www.instagram.com/systemforge',
    tiktok: 'https://www.tiktok.com/@systemforge',
  },
  navigation: [
    { label: 'Inicio', href: '/' },
    { label: 'Servicios', href: '/servicos' },
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
  // Slugs fisicos pt-BR: o app/ so gera rotas PT. Slugs localizados
  // (/servicios, /privacidad, /asesor) pendem da feature i18n-triple-market;
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
