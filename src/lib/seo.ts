/**
 * lib/seo.ts
 * Utilitário de SEO para Next.js App Router.
 *
 * Uso em páginas:
 *   export const metadata = generatePageMetadata({
 *     title: 'SaaS — SystemForge',
 *     description: '...',
 *     path: '/servicos/saas',
 *   })
 *
 * REGRA: Toda página DEVE chamar generatePageMetadata.
 * Nunca exportar metadata com valores hardcoded.
 */
import type { Metadata } from 'next'
import type { PageMetadataConfig } from './types'
import { SEO_DEFAULTS } from './constants/seo'

// Importação defensiva de env (site pode ser buildado sem SITE_URL em dev)
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://forjadesistemas.com.br'
}

/**
 * Gera objeto Metadata do Next.js com OG, Twitter Card, canonical e robots.
 *
 * @param config - Configuração da página
 * @returns Metadata — exportar diretamente como `export const metadata = ...`
 */
export function generatePageMetadata(config: PageMetadataConfig): Metadata {
  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}${config.path}`
  const ogImage = config.ogImage ?? SEO_DEFAULTS.defaultOgImage
  const ogImageUrl = ogImage.startsWith('/')
    ? `${siteUrl}${ogImage}`
    : ogImage

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonicalUrl,
      siteName: SEO_DEFAULTS.siteName,
      locale: SEO_DEFAULTS.locale,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
    },
    twitter: {
      card: SEO_DEFAULTS.twitterCard,
      title: config.title,
      description: config.description,
      images: [ogImageUrl],
      ...(SEO_DEFAULTS.twitterHandle
        ? { creator: SEO_DEFAULTS.twitterHandle }
        : {}),
    },
    robots: {
      index: !config.noIndex,
      follow: !config.noIndex,
      googleBot: {
        index: !config.noIndex,
        follow: !config.noIndex,
      },
    },
  }
}

/**
 * Gera metadata para a página inicial (título sem template).
 */
export function generateHomeMetadata(): Metadata {
  return {
    ...generatePageMetadata({
      title: SEO_DEFAULTS.homeTitle,
      description: SEO_DEFAULTS.defaultDescription,
      path: '/',
    }),
    title: {
      absolute: SEO_DEFAULTS.homeTitle,
    },
  }
}

/**
 * Template de título para uso no RootLayout (module-3).
 * Páginas filhas apenas definem `title: 'Título da Página'`
 * e o Next.js formata como 'Título da Página | SystemForge'.
 */
export const rootMetadata: Metadata = {
  title: {
    template: SEO_DEFAULTS.titleTemplate,
    default: SEO_DEFAULTS.homeTitle,
  },
  description: SEO_DEFAULTS.defaultDescription,
  metadataBase: new URL(getSiteUrl()),
}
