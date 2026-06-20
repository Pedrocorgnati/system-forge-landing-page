import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLdOrganization } from '@/components/seo/JsonLdOrganization'
import { JsonLdLocalBusiness } from '@/components/seo/JsonLdLocalBusiness'
import { LanguageSuggestionBanner } from '@/components/ui/LanguageSuggestionBanner'
import { DevOverlayLoader } from '@/components/dev/DevOverlayLoader'
import { CookieBanner } from '@/components/ui/CookieBanner'
import { Analytics } from '@/components/analytics/Analytics'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { getSiteConfig, LOCALE_URLS, SUPPORTED_LOCALES } from '@config'
import { loadMessages } from '@config/content'
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

// Chamadas em nível de módulo — intencionais para output: 'export'.
// No static export, este módulo é avaliado uma vez por processo de build (não por request).
// Em caso de migração para SSR, mover para dentro do componente ou envolver em React.cache().
const config = getSiteConfig()
const messages = loadMessages()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563EB' },
    { media: '(prefers-color-scheme: dark)', color: '#3A82FF' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(config.url),
  title: {
    default: config.seo.title,
    template: config.seo.titleTemplate,
  },
  description: config.seo.description,
  authors: [{ name: config.author }],
  creator: config.author,
  openGraph: {
    type: 'website',
    locale: config.ogLocale,
    url: config.url,
    siteName: config.siteName,
    title: config.seo.title,
    description: config.seo.description,
    images: [
      {
        url: config.seo.ogImage,
        width: 1200,
        height: 630,
        alt: `${config.siteName}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.seo.title,
    description: config.seo.description,
    images: [config.seo.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: config.url,
    languages: Object.fromEntries(
      SUPPORTED_LOCALES.map(locale => [locale, LOCALE_URLS[locale]])
    ),
    types: {
      'application/rss+xml': `${config.url}/blog/feed.xml`,
      'application/feed+json': `${config.url}/blog/feed.json`,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  verification: {
    // Só emite a meta google-site-verification com um token REAL — nunca o
    // placeholder de build ("[PRODUCTION] seu_token_gsc_aqui"), que viraria
    // uma meta tag inválida em produção.
    google: ((t) => (t && !t.includes('[PRODUCTION]') && !/seu_token|placeholder/i.test(t) ? t : undefined))(
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    ),
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang={config.htmlLang}
      className={`${inter.className} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* hreflang links for cross-domain SEO */}
        {SUPPORTED_LOCALES.map(locale => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale === 'pt-BR' ? 'pt-BR' : locale === 'it-IT' ? 'it' : locale === 'es-ES' ? 'es' : 'en'}
            href={LOCALE_URLS[locale]}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={LOCALE_URLS['en']} />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          {/* Skip navigation — a11y */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
          >
            {messages.accessibility.skipToContent}
          </a>
          <LanguageSuggestionBanner />
          <Header />
          <main id="main-content" data-testid="main-content" className="flex-1">
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </main>
          <Footer />
          <DevOverlayLoader />
          <CookieBanner />
          <Analytics />
          <JsonLdOrganization siteConfig={config} />
          <JsonLdLocalBusiness siteConfig={config} />
          <WebVitalsReporter />
        </ThemeProvider>
      </body>
    </html>
  )
}
