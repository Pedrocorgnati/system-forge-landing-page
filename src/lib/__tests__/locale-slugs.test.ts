import { describe, it, expect } from 'vitest'
import {
  ROUTE_SLUGS,
  SERVICE_SLUGS,
  SERVICE_CATEGORY_SLUGS,
  getSlug,
} from '../locale-slugs'
import type { SupportedLocale } from '@config/types'

const LOCALES: SupportedLocale[] = ['pt-BR', 'it-IT', 'en']

describe('locale-slugs', () => {
  // -------------------------------------------------------------------------
  // ROUTE_SLUGS
  // -------------------------------------------------------------------------
  describe('ROUTE_SLUGS', () => {
    it('all values are lowercase', () => {
      for (const locale of LOCALES) {
        for (const slug of Object.values(ROUTE_SLUGS[locale])) {
          expect(slug).toBe(slug.toLowerCase())
        }
      }
    })

    it('all values start with /', () => {
      for (const locale of LOCALES) {
        for (const slug of Object.values(ROUTE_SLUGS[locale])) {
          expect(slug.startsWith('/')).toBe(true)
        }
      }
    })

    it('no value contains spaces', () => {
      for (const locale of LOCALES) {
        for (const slug of Object.values(ROUTE_SLUGS[locale])) {
          expect(slug).not.toMatch(/\s/)
        }
      }
    })

    it('has 3 locales with 8 routes each', () => {
      const localeKeys = Object.keys(ROUTE_SLUGS)
      expect(localeKeys).toHaveLength(3)
      for (const locale of localeKeys) {
        const routes = Object.keys(ROUTE_SLUGS[locale as SupportedLocale])
        expect(routes).toHaveLength(8)
      }
    })
  })

  // -------------------------------------------------------------------------
  // SERVICE_SLUGS
  // -------------------------------------------------------------------------
  describe('SERVICE_SLUGS', () => {
    it('has 15 keys (all ServiceCategory keys)', () => {
      expect(Object.keys(SERVICE_SLUGS)).toHaveLength(15)
    })

    it('all values are lowercase and start with /', () => {
      for (const category of Object.values(SERVICE_SLUGS)) {
        for (const slug of Object.values(category)) {
          expect(slug).toBe(slug.toLowerCase())
          expect(slug.startsWith('/')).toBe(true)
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // SERVICE_CATEGORY_SLUGS
  // -------------------------------------------------------------------------
  describe('SERVICE_CATEGORY_SLUGS', () => {
    it('values match corresponding SERVICE_SLUGS entries', () => {
      expect(SERVICE_CATEGORY_SLUGS.BOTS).toBe(SERVICE_SLUGS.BOTS)
      expect(SERVICE_CATEGORY_SLUGS.LANDING_PAGE).toBe(SERVICE_SLUGS.LANDING_PAGE)
      expect(SERVICE_CATEGORY_SLUGS.DESKTOP).toBe(SERVICE_SLUGS.DESKTOP)
      expect(SERVICE_CATEGORY_SLUGS.GESTAO).toBe(SERVICE_SLUGS.GESTAO)
    })
  })

  // -------------------------------------------------------------------------
  // getSlug
  // -------------------------------------------------------------------------
  describe('getSlug', () => {
    it('returns /servicos for services in pt-BR', () => {
      expect(getSlug('services', 'pt-BR')).toBe('/servicos')
    })

    it('returns /servizi for services in it-IT', () => {
      expect(getSlug('services', 'it-IT')).toBe('/servizi')
    })

    it('returns /services for services in en', () => {
      expect(getSlug('services', 'en')).toBe('/services')
    })
  })
})
