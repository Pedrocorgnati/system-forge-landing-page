// @vitest-environment jsdom
/**
 * JSON-LD SEO Components — unit tests
 *
 * INT-028 — Schema.org JSON-LD por mercado
 * module-12-compliance-seo TASK-2/ST001–ST003, TASK-7/ST003 (auditoria)
 *
 * Scenarios:
 * 1. JsonLdOrganization renders valid JSON-LD with Organization @type
 * 2. JsonLdOrganization escapes < > & characters safely
 * 3. JsonLdOrganization filters undefined sameAs entries
 * 4. JsonLdLocalBusiness renders correct areaServed per locale
 * 5. JsonLdLocalBusiness omits address when not present
 * 6. JsonLdBlogPosting truncates headline at 110 chars
 * 7. JsonLdBlogPosting uses updatedAt for dateModified when present
 * 8. JsonLdBlogPosting falls back to date when updatedAt absent
 * 9. JsonLdBlogPosting uses default image when coverImage absent
 * 10. All 3 components produce valid JSON.parse output
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import { JsonLdOrganization } from '../seo/JsonLdOrganization'
import { JsonLdLocalBusiness } from '../seo/JsonLdLocalBusiness'
import { JsonLdBlogPosting } from '../seo/JsonLdBlogPosting'

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

const baseSiteConfig = {
  siteName: 'SystemForge',
  url: 'https://systemforgesoftware.com',
  description: 'Software development',
  author: 'Pedro Corgnati',
  email: 'info@systemforgesoftware.com',
  htmlLang: 'en',
  locale: 'en' as const,
  ogLocale: 'en_US',
  socialLinks: {
    linkedin: 'https://linkedin.com/in/pedro',
    github: 'https://github.com/pedro',
  },
  seo: {
    title: 'SystemForge',
    titleTemplate: '%s | SystemForge',
    description: 'Software dev',
    ogImage: '/images/og.png',
  },
  routes: {
    home: '/',
    services: '/services',
    contact: '/contact',
    blog: '/blog',
    privacy: '/privacy',
  },
}

const brSiteConfig = {
  ...baseSiteConfig,
  siteName: 'Forja de Sistemas',
  url: 'https://forjadesistemas.com.br',
  locale: 'pt-BR' as const,
  htmlLang: 'pt-BR',
}

const itSiteConfig = {
  ...baseSiteConfig,
  siteName: 'SystemForge',
  url: 'https://systemforge.it',
  locale: 'it-IT' as const,
  htmlLang: 'it',
}

const basePost = {
  title: 'How to Build SEO-Friendly Websites',
  slug: 'seo-friendly-websites',
  date: '2026-03-28',
  description: 'A guide to building SEO-friendly websites',
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function extractJsonLd(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]')
  if (!script?.textContent) throw new Error('No JSON-LD script found')
  return JSON.parse(script.textContent)
}

/* -------------------------------------------------------------------------- */
/*  JsonLdOrganization                                                        */
/* -------------------------------------------------------------------------- */

describe('JsonLdOrganization', () => {
  it('renders valid Organization schema', () => {
    const { container } = render(
      <JsonLdOrganization siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema['@type']).toBe('Organization')
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema.name).toBe('SystemForge')
    expect(schema.url).toBe('https://systemforgesoftware.com')
  })

  it('escapes < > & characters safely', () => {
    const configWithSpecialChars = {
      ...baseSiteConfig,
      siteName: 'Pedro & Sistemas <Dev>',
    }
    const { container } = render(
      <JsonLdOrganization siteConfig={configWithSpecialChars as never} />
    )
    const scriptContent = container.querySelector(
      'script[type="application/ld+json"]'
    )?.innerHTML ?? ''
    expect(scriptContent).not.toContain('<Dev>')
    expect(scriptContent).toContain('\\u003cDev\\u003e')
    expect(scriptContent).toContain('\\u0026')
    // Must still be valid JSON after unescaping
    const parsed = JSON.parse(scriptContent)
    expect(parsed.name).toBe('Pedro & Sistemas <Dev>')
  })

  it('filters undefined sameAs entries', () => {
    const configNoGithub = {
      ...baseSiteConfig,
      socialLinks: { linkedin: 'https://linkedin.com/in/pedro', github: undefined },
    }
    const { container } = render(
      <JsonLdOrganization siteConfig={configNoGithub as never} />
    )
    const schema = extractJsonLd(container)
    const sameAs = schema.sameAs as string[]
    expect(sameAs).not.toContain(undefined)
    expect(sameAs.length).toBe(1)
  })
})

/* -------------------------------------------------------------------------- */
/*  JsonLdLocalBusiness                                                       */
/* -------------------------------------------------------------------------- */

describe('JsonLdLocalBusiness', () => {
  it('renders correct areaServed for BR locale', () => {
    const { container } = render(
      <JsonLdLocalBusiness siteConfig={brSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema['@type']).toBe('LocalBusiness')
    expect(schema.areaServed).toBe('Brasil')
    expect(schema.serviceType).toBe('Desenvolvimento de Software')
  })

  it('renders correct areaServed for IT locale', () => {
    const { container } = render(
      <JsonLdLocalBusiness siteConfig={itSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.areaServed).toBe('Italia')
    expect(schema.serviceType).toBe('Sviluppo Software')
  })

  it('renders correct areaServed for EN locale', () => {
    const { container } = render(
      <JsonLdLocalBusiness siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.areaServed).toBe('International')
    expect(schema.serviceType).toBe('Software Development')
  })

  it('omits address when not present in config', () => {
    const { container } = render(
      <JsonLdLocalBusiness siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.address).toBeUndefined()
  })

  it('includes address when present in config', () => {
    const configWithAddress = { ...brSiteConfig, address: 'Rua X, 123' }
    const { container } = render(
      <JsonLdLocalBusiness siteConfig={configWithAddress as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.address).toBeDefined()
    expect((schema.address as Record<string, string>).addressCountry).toBe('BR')
  })
})

/* -------------------------------------------------------------------------- */
/*  JsonLdBlogPosting                                                         */
/* -------------------------------------------------------------------------- */

describe('JsonLdBlogPosting', () => {
  it('truncates headline at 110 characters', () => {
    const longTitle = 'A'.repeat(150)
    const post = { ...basePost, title: longTitle }
    const { container } = render(
      <JsonLdBlogPosting post={post} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect((schema.headline as string).length).toBe(110)
  })

  it('does not truncate short headlines', () => {
    const { container } = render(
      <JsonLdBlogPosting post={basePost} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.headline).toBe(basePost.title)
  })

  it('uses updatedAt for dateModified when present', () => {
    const post = { ...basePost, updatedAt: '2026-03-30' }
    const { container } = render(
      <JsonLdBlogPosting post={post} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.dateModified).toBe('2026-03-30')
  })

  it('falls back to date when updatedAt absent', () => {
    const { container } = render(
      <JsonLdBlogPosting post={basePost} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.dateModified).toBe(basePost.date)
  })

  it('uses default image when coverImage absent', () => {
    const { container } = render(
      <JsonLdBlogPosting post={basePost} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.image).toBe('https://systemforgesoftware.com/images/og-default.png')
  })

  it('uses coverImage when provided', () => {
    const post = { ...basePost, coverImage: '/images/cover.png' }
    const { container } = render(
      <JsonLdBlogPosting post={post} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    expect(schema.image).toBe('https://systemforgesoftware.com/images/cover.png')
  })

  it('renders author as Organization (not Person)', () => {
    const { container } = render(
      <JsonLdBlogPosting post={basePost} siteConfig={baseSiteConfig as never} />
    )
    const schema = extractJsonLd(container)
    const author = schema.author as Record<string, string>
    expect(author['@type']).toBe('Organization')
    expect(author.name).toBe('SystemForge')
  })

  it('produces valid JSON.parse output with special chars', () => {
    const post = { ...basePost, title: 'Next.js & React <Tips>' }
    const { container } = render(
      <JsonLdBlogPosting post={post} siteConfig={baseSiteConfig as never} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow()
    const schema = JSON.parse(script!.innerHTML)
    expect(schema.headline).toBe('Next.js & React <Tips>')
  })
})
