import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/ui/JsonLd'
import { DevOverlayLoader } from '@/components/dev/DevOverlayLoader'
import { organizationSchema } from '@/lib/schema'
import { SITE } from '@/lib/constants'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Software House sob medida`,
    template: `%s | ${SITE.name}`,
  },
  description:
    'Desenvolvemos software sob medida: SaaS, apps mobile, landing pages, e-commerce, dashboards e automações com IA. De projetos simples a sistemas complexos.',
  keywords: [
    'software house',
    'desenvolvimento web',
    'desenvolvimento mobile',
    'SaaS',
    'landing page',
    'React',
    'Next.js',
    'Python',
    'IA',
    'automação',
  ],
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — Software House sob medida`,
    description:
      'Desenvolvemos software sob medida: SaaS, apps mobile, landing pages, e-commerce, dashboards e automações com IA.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE.name} — Software House`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — Software House sob medida`,
    description:
      'Desenvolvemos software sob medida: SaaS, apps mobile, landing pages, e-commerce, dashboards e automações com IA.',
    images: ['/images/og-image.png'],
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
    canonical: SITE.url,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.className} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          {/* Skip navigation — a11y */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
          >
            Pular para o conteúdo
          </a>
          <Header />
          <main id="main-content" data-testid="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <DevOverlayLoader />
          <JsonLd schema={organizationSchema} />
        </ThemeProvider>
      </body>
    </html>
  )
}
