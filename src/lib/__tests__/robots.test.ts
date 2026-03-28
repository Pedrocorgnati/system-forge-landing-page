/**
 * src/lib/__tests__/robots.test.ts
 * Testes unitarios para src/app/robots.ts
 *
 * GAP-001 — robots.ts sem testes unitarios (US-011a)
 * module-9-seo-sitemaps TASK-5/ST001
 */
import { describe, it, expect, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSiteConfig = vi.fn()

vi.mock('@config', () => ({
  getSiteConfig: () => mockGetSiteConfig(),
}))

// ---------------------------------------------------------------------------
// Import (after mocks)
// ---------------------------------------------------------------------------

import robots from '../../app/robots'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('robots()', () => {
  it('sitemap URL points to BR domain for pt-BR build', () => {
    mockGetSiteConfig.mockReturnValue({
      locale: 'pt-BR',
      url: 'https://forjadesistemas.com.br',
    })

    const result = robots()

    expect(result.sitemap).toBe('https://forjadesistemas.com.br/sitemap.xml')
    expect(result.host).toBe('https://forjadesistemas.com.br')
  })

  it('sitemap URL points to IT domain for it-IT build', () => {
    mockGetSiteConfig.mockReturnValue({
      locale: 'it-IT',
      url: 'https://systemforge.it',
    })

    const result = robots()

    expect(result.sitemap).toBe('https://systemforge.it/sitemap.xml')
    expect(result.host).toBe('https://systemforge.it')
  })

  it('sitemap URL points to EN domain for en build', () => {
    mockGetSiteConfig.mockReturnValue({
      locale: 'en',
      url: 'https://systemforgesoftware.com',
    })

    const result = robots()

    expect(result.sitemap).toBe('https://systemforgesoftware.com/sitemap.xml')
    expect(result.host).toBe('https://systemforgesoftware.com')
  })

  it('strips trailing slash from siteUrl', () => {
    mockGetSiteConfig.mockReturnValue({
      locale: 'pt-BR',
      url: 'https://forjadesistemas.com.br/',
    })

    const result = robots()

    expect(result.sitemap).toBe('https://forjadesistemas.com.br/sitemap.xml')
    expect(result.host).toBe('https://forjadesistemas.com.br')
    // No double-slash (excluding protocol)
    const urlWithoutProtocol = result.sitemap!.toString().replace(/^https?:\/\//, '')
    expect(urlWithoutProtocol).not.toContain('//')
  })

  it('disallows infrastructure routes', () => {
    mockGetSiteConfig.mockReturnValue({
      locale: 'pt-BR',
      url: 'https://forjadesistemas.com.br',
    })

    const result = robots()
    const rules = result.rules

    expect(rules).toBeDefined()
    expect(Array.isArray(rules)).toBe(true)

    const mainRule = Array.isArray(rules) ? rules[0] : rules
    expect(mainRule.userAgent).toBe('*')
    expect(mainRule.allow).toBe('/')
    expect(mainRule.disallow).toContain('/api/')
    expect(mainRule.disallow).toContain('/_next/')
  })
})
