/**
 * src/lib/__tests__/sitemap.test.ts
 * Testes unitários para sitemap.ts e build-alternates.ts (hreflang multi-domain).
 *
 * INT-072 — Invariante x-default → EN em todas as URLs com alternates.
 * module-9-seo-sitemaps TASK-1/ST007
 */
import { describe, it, expect, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declarados antes dos imports estáticos (hoisting)
// ---------------------------------------------------------------------------

vi.mock('@config', () => ({
  getSiteConfig: () => ({
    locale: 'pt-BR',
    url: 'https://forjadesistemas.com.br',
    siteName: 'Forja de Sistemas',
    domain: 'forjadesistemas.com.br',
    ga4MeasurementId: undefined,
  }),
  LOCALE_URLS: {
    'pt-BR': 'https://forjadesistemas.com.br',
    'it-IT': 'https://systemforge.it',
    'en': 'https://systemforgesoftware.com',
  },
  SUPPORTED_LOCALES: ['pt-BR', 'it-IT', 'en'],
}))

vi.mock('@config/types', () => ({}))

vi.mock('@/lib/locale-slugs', () => ({
  ROUTE_SLUGS: {
    'pt-BR': {
      home: '/',
      services: '/servicos',
      portfolio: '/portfolio',
      about: '/sobre',
      contact: '/contato',
      blog: '/blog',
      advisor: '/conselheiro',
      privacy: '/privacidade',
    },
    'it-IT': {
      home: '/',
      services: '/servizi',
      portfolio: '/portfolio',
      about: '/chi-siamo',
      contact: '/contatto',
      blog: '/blog',
      advisor: '/consulente',
      privacy: '/privacy',
    },
    'en': {
      home: '/',
      services: '/services',
      portfolio: '/portfolio',
      about: '/about',
      contact: '/contact',
      blog: '/blog',
      advisor: '/advisor',
      privacy: '/privacy',
    },
  },
  SERVICE_SLUGS: {},
}))

vi.mock('@/lib/types', () => ({
  ServiceCategory: {},
}))

vi.mock('@/lib/blog-articles', () => ({
  getArticlesForLocale: () => [
    {
      slug: 'saas-vs-custom',
      localeSlugMap: {
        'pt-BR': 'saas-vs-sob-medida',
        'it-IT': 'saas-vs-personalizzato',
        'en': 'saas-vs-custom',
      },
      exclusive: false,
    },
    {
      slug: 'carnaval-2025',
      localeSlugMap: { 'pt-BR': 'carnaval-2025' },
      exclusive: true,
    },
  ],
}))

// ---------------------------------------------------------------------------
// Imports estáticos (após mocks)
// ---------------------------------------------------------------------------

import sitemap from '../../app/sitemap'
import { buildLanguagesForRoute, buildLanguagesForArticle, getCanonicalUrl } from '../seo/build-alternates'
import type { ArticleHreflang } from '../../../src/types/hreflang.types'

// ---------------------------------------------------------------------------
// Testes: sitemap()
// ---------------------------------------------------------------------------

describe('sitemap()', () => {
  it('returns at least 8 institutional entries', () => {
    const entries = sitemap()
    expect(entries.length).toBeGreaterThanOrEqual(8)
  })

  it('every entry with alternates has x-default pointing to EN domain', () => {
    const entries = sitemap()

    for (const entry of entries) {
      if (entry.alternates?.languages) {
        expect(entry.alternates.languages['x-default']).toMatch(
          /^https:\/\/systemforgesoftware\.com/,
        )
      }
    }
  })

  it('home URL is the base domain (no trailing path)', () => {
    const entries = sitemap()
    const home = entries.find(e => e.url === 'https://forjadesistemas.com.br')
    expect(home).toBeDefined()
    expect(home!.priority).toBe(1.0)
  })

  it('services URL is /servicos for pt-BR build', () => {
    const entries = sitemap()
    const services = entries.find(e => e.url === 'https://forjadesistemas.com.br/servicos')

    expect(services).toBeDefined()
    expect(services!.alternates?.languages?.['it']).toMatch(
      /^https:\/\/systemforge\.it\/servizi/,
    )
    expect(services!.alternates?.languages?.['en']).toMatch(
      /^https:\/\/systemforgesoftware\.com\/services/,
    )
  })

  it('no entry has a double-slash in its URL (excluding protocol)', () => {
    const entries = sitemap()

    for (const entry of entries) {
      const urlWithoutProtocol = entry.url.replace(/^https?:\/\//, '')
      expect(urlWithoutProtocol).not.toContain('//')
    }
  })

  it('all entries have a valid URL starting with https', () => {
    const entries = sitemap()
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https:\/\//)
    }
  })

  it('universal blog article has hreflang alternates with x-default', () => {
    const entries = sitemap()
    const articleEntry = entries.find(e =>
      e.url === 'https://forjadesistemas.com.br/blog/saas-vs-sob-medida',
    )

    expect(articleEntry).toBeDefined()
    expect(articleEntry!.alternates?.languages?.['x-default']).toMatch(
      /^https:\/\/systemforgesoftware\.com\/blog\/saas-vs-custom/,
    )
    expect(articleEntry!.alternates?.languages?.['it']).toMatch(
      /^https:\/\/systemforge\.it\/blog\/saas-vs-personalizzato/,
    )
  })

  it('exclusive blog article has no alternates', () => {
    const entries = sitemap()
    const exclusiveEntry = entries.find(e =>
      e.url === 'https://forjadesistemas.com.br/blog/carnaval-2025',
    )

    expect(exclusiveEntry).toBeDefined()
    expect(exclusiveEntry!.alternates).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Testes: buildLanguagesForRoute()
// ---------------------------------------------------------------------------

describe('buildLanguagesForRoute()', () => {
  it('builds correct hreflang languages for services', () => {
    const languages = buildLanguagesForRoute('services')

    expect(languages['pt-BR']).toBe('https://forjadesistemas.com.br/servicos')
    expect(languages['it']).toBe('https://systemforge.it/servizi')
    expect(languages['en']).toBe('https://systemforgesoftware.com/services')
    expect(languages['x-default']).toBe('https://systemforgesoftware.com/services')
  })

  it('home route returns base URL without trailing slash', () => {
    const languages = buildLanguagesForRoute('home')

    expect(languages['pt-BR']).toBe('https://forjadesistemas.com.br')
    expect(languages['it']).toBe('https://systemforge.it')
    expect(languages['en']).toBe('https://systemforgesoftware.com')
    expect(languages['x-default']).toBe('https://systemforgesoftware.com')
  })

  it('all routes include x-default pointing to EN domain', () => {
    const routeKeys = ['home', 'services', 'portfolio', 'blog', 'about', 'contact'] as const
    for (const key of routeKeys) {
      const languages = buildLanguagesForRoute(key)
      expect(languages['x-default']).toMatch(/^https:\/\/systemforgesoftware\.com/)
    }
  })
})

// ---------------------------------------------------------------------------
// Testes: buildLanguagesForArticle()
// ---------------------------------------------------------------------------

describe('buildLanguagesForArticle()', () => {
  it('returns undefined for exclusive articles', () => {
    const article: ArticleHreflang = {
      slug: 'carnaval-2025',
      localeSlugMap: { 'pt-BR': 'carnaval-2025' },
      exclusive: true,
    }
    expect(buildLanguagesForArticle(article)).toBeUndefined()
  })

  it('builds correct hreflang for universal article', () => {
    const article: ArticleHreflang = {
      slug: 'about-us',
      localeSlugMap: {
        'pt-BR': 'sobre-nos',
        'it-IT': 'chi-siamo',
        'en': 'about-us',
      },
      exclusive: false,
    }
    const languages = buildLanguagesForArticle(article)

    expect(languages).toBeDefined()
    expect(languages!['pt-BR']).toBe('https://forjadesistemas.com.br/blog/sobre-nos')
    expect(languages!['it']).toBe('https://systemforge.it/blog/chi-siamo')
    expect(languages!['en']).toBe('https://systemforgesoftware.com/blog/about-us')
    expect(languages!['x-default']).toBe('https://systemforgesoftware.com/blog/about-us')
  })

  it('returns undefined when only 1 locale in localeSlugMap', () => {
    const article: ArticleHreflang = {
      slug: 'single-locale',
      localeSlugMap: { 'en': 'single-locale' },
      exclusive: false,
    }
    expect(buildLanguagesForArticle(article)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Testes: getCanonicalUrl()
// GAP-006 — getCanonicalUrl() sem cobertura de teste
// ---------------------------------------------------------------------------

describe('getCanonicalUrl()', () => {
  it('returns correct canonical for pt-BR locale', () => {
    const url = getCanonicalUrl('/servicos', 'pt-BR')
    expect(url).toBe('https://forjadesistemas.com.br/servicos')
  })

  it('returns correct canonical for EN locale', () => {
    const url = getCanonicalUrl('/services', 'en')
    expect(url).toBe('https://systemforgesoftware.com/services')
  })

  it('returns base URL without trailing path for home', () => {
    const url = getCanonicalUrl('/', 'it-IT')
    expect(url).toBe('https://systemforge.it')
  })

  it('falls back to pt-BR when locale is not provided and env is unset', () => {
    const original = process.env.NEXT_PUBLIC_LOCALE
    delete process.env.NEXT_PUBLIC_LOCALE
    const url = getCanonicalUrl('/servicos')
    expect(url).toBe('https://forjadesistemas.com.br/servicos')
    process.env.NEXT_PUBLIC_LOCALE = original
  })
})
