import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getSiteConfig, getActiveLocale, isLocale } from '../i18n'

describe('i18n', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset to clean state before each test
    delete process.env.NEXT_PUBLIC_LOCALE
    delete process.env.NODE_ENV
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  // -------------------------------------------------------------------------
  // getSiteConfig
  // -------------------------------------------------------------------------
  describe('getSiteConfig', () => {
    it('returns brConfig when locale is pt-BR', () => {
      const config = getSiteConfig('pt-BR')
      expect(config.locale).toBe('pt-BR')
    })

    it('returns itConfig when locale is it-IT', () => {
      const config = getSiteConfig('it-IT')
      expect(config.locale).toBe('it-IT')
    })

    it('returns enConfig when locale is en', () => {
      const config = getSiteConfig('en')
      expect(config.locale).toBe('en')
    })

    it('throws Error with "Locale inválido" for unsupported locale', () => {
      expect(() => getSiteConfig('fr-FR' as any)).toThrow('Locale inválido')
    })

    it('returns itConfig even when NEXT_PUBLIC_LOCALE=pt-BR (arg has precedence)', () => {
      process.env.NEXT_PUBLIC_LOCALE = 'pt-BR'
      const config = getSiteConfig('it-IT')
      expect(config.locale).toBe('it-IT')
    })
  })

  // -------------------------------------------------------------------------
  // getActiveLocale
  // -------------------------------------------------------------------------
  describe('getActiveLocale', () => {
    it('throws in production when NEXT_PUBLIC_LOCALE is not set', () => {
      process.env.NODE_ENV = 'production'
      expect(() => getActiveLocale()).toThrow('NEXT_PUBLIC_LOCALE não definido em produção')
    })

    it('returns pt-BR in development when NEXT_PUBLIC_LOCALE is not set', () => {
      process.env.NODE_ENV = 'development'
      expect(getActiveLocale()).toBe('pt-BR')
    })
  })

  // -------------------------------------------------------------------------
  // isLocale
  // -------------------------------------------------------------------------
  describe('isLocale', () => {
    it('returns true for valid locale pt-BR', () => {
      expect(isLocale('pt-BR')).toBe(true)
    })

    it('returns false for unsupported locale fr-FR', () => {
      expect(isLocale('fr-FR')).toBe(false)
    })

    it('returns false for non-string value', () => {
      expect(isLocale(123)).toBe(false)
    })
  })
})
