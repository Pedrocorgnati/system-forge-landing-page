/**
 * config/types.ts
 * Tipos centrais do sistema i18n triple-market.
 */

export type SupportedLocale = 'pt-BR' | 'it-IT' | 'en' | 'es-ES'

export type MarketCurrency = 'BRL' | 'EUR' | 'USD'

export type ComplianceFramework = 'LGPD' | 'GDPR' | 'CAN-SPAM'

export interface SiteConfig {
  locale: SupportedLocale
  htmlLang: string
  ogLocale: string
  siteName: string
  domain: string
  url: string
  tagline: string
  description: string
  author: string
  email: string
  whatsapp: string
  calendly: string
  budgetEngine: string
  address: string
  compliance: ComplianceFramework
  currency: MarketCurrency
  /**
   * Multibackend OIDC (Modelo B). Vinculo do site estatico ao IdP central
   * (systemforgedashboard.com) com a origin/moeda/idioma corretos por dominio.
   * Todos os valores sao PUBLICOS (client_id publico PKCE; nunca client_secret).
   */
  oidc: {
    /** client_id publico registrado em OIDC_CLIENTS do IdP (ex.: systemforge-it). */
    clientId: string
    /** redirect_uri exato (match no IdP): https://{dominio}/auth/callback. */
    redirectUri: string
    /** authority = issuer central (https://www.systemforgedashboard.com). */
    authority: string
    /** ui_locales para a tela de login do IdP (apresentacao; nao decide moeda). */
    uiLocale?: string
  }
  newsletter: {
    workerUrl: string
    doubleOptIn: boolean
  }
  /**
   * Quote Worker (leads de orcamento). workerUrl resolvido por build via
   * NEXT_PUBLIC_QUOTE_WORKER_URL_{BR,IT,EN,ES}; o submit do quote-wizard
   * (src/lib/services/quote-lead.ts) faz POST {workerUrl}/lead.
   */
  quoteLead: {
    workerUrl: string
  }
  socialLinks: {
    linkedin: string
    github: string
    instagram: string
    tiktok: string
  }
  navigation: NavItem[]
  seo: {
    title: string
    description: string
    titleTemplate: string
    ogImage: string
  }
  routes: LocaleRoutes
  newsletterApiUrl: string
  ga4MeasurementId?: string
}

export interface NavItem {
  label: string
  href: string
}

export interface LocaleRoutes {
  home: string
  services: string
  service: (slug: string) => string
  portfolio: string
  portfolioProject: (slug: string) => string
  blog: string
  blogPost: (slug: string) => string
  blogPage: (n: number) => string
  blogCategory: (cat: string) => string
  blogTag: (tag: string) => string
  privacy: string
  newsletterConfirmed: string
  advisor: string
  contact: string
}

export interface LocaleMessages {
  newsletter: {
    heading: string
    submit: string
    loading: string
    success: string
    pendingConfirmation: string
    error: string
    retry: string
    placeholder: string
    ariaLabel: string
    emailInvalid: string
    consentRequired: string
    consentLabel: string
    consentInfo: string
    privacyLinkText: string
    timeoutError: string
  }
  contact: {
    title: string
    subtitle: string
    nameLabel: string
    emailLabel: string
    messageLabel: string
    submit: string
    sectionLabel: string
    heading: string
    headingHighlight: string
    responseTime: string
    whatsappDesc: string
    whatsappCta: string
    whatsappMessage: string
    scheduleLabel: string
    scheduleDesc: string
    scheduleCta: string
    budgetLabel: string
    budgetDesc: string
    budgetCta: string
    emailFallback: string
  }
  errors: {
    generic: string
    notFound: string
    network: string
  }
  empty: {
    portfolio: string
    blog: string
    search: string
  }
  loading: {
    generic: string
    search: string
  }
  cta: {
    whatsapp: string
    calendly: string
    budget: string
    contact: string
    portfolio: string
    services: string
    readMore: string
    viewAllArticles: string
    viewAllProjects: string
    exploreService: string
  }
  accessibility: {
    menuToggle: string
    close: string
    externalLink: string
    skipToContent: string
    openMenu: string
    closeMenu: string
  }
  notFound: {
    title: string
    code: string
    description: string
    homeButton: string
    contactButton: string
  }
  cookie: {
    title: string
    description: string
    privacyLink: string
    acceptAll: string
    reject: string
    managePreferences?: string
    gotIt?: string
    legalReference: string
    cookiePreferences?: string
  }
  cookieModal?: {
    title: string
    subtitle: string
    close: string
    necessary: { label: string; description: string; badge: string }
    analytics: { label: string; description: string }
    marketing: { label: string; description: string }
    save: string
  }
  languageBanner: {
    message: string
    visit: string
    dismiss: string
  }
  breadcrumb: {
    home: string
    ariaLabel: string
    services: string
    portfolio: string
    blog: string
    privacy: string
    advisor: string
  }
  sections: Record<string, { ariaLabel: string; title?: string; subtitle?: string }>
}
