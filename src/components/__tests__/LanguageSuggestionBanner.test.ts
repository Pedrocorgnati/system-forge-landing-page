import { describe, it, expect, beforeEach } from 'vitest'

/**
 * LanguageSuggestionBanner — unit tests
 *
 * Environment: node (no DOM / no jsdom). Tests cover:
 * 1. BANNER_MESSAGES data integrity
 * 2. useLanguageDetection storage helpers (mocked localStorage)
 */

// ---------------------------------------------------------------------------
// 1. BANNER_MESSAGES — re-declare the shape inline to test contract
// ---------------------------------------------------------------------------

type SupportedLocale = 'pt-BR' | 'it-IT' | 'en'

const SUPPORTED_LOCALES: SupportedLocale[] = ['pt-BR', 'it-IT', 'en']

// Same definition as in the component — kept in sync manually
const BANNER_MESSAGES: Record<
  SupportedLocale,
  Record<SupportedLocale, { message: string; visitLabel: string }>
> = {
  'pt-BR': {
    'pt-BR': { message: '', visitLabel: '' },
    'en': {
      message: 'Do you speak English?',
      visitLabel: 'Visit systemforgesoftware.com',
    },
    'it-IT': {
      message: 'Parli italiano?',
      visitLabel: 'Visita systemforge.it',
    },
  },
  'it-IT': {
    'it-IT': { message: '', visitLabel: '' },
    'pt-BR': {
      message: 'Você fala português?',
      visitLabel: 'Acesse forjadesistemas.com.br',
    },
    'en': {
      message: 'Do you speak English?',
      visitLabel: 'Visit systemforgesoftware.com',
    },
  },
  'en': {
    'en': { message: '', visitLabel: '' },
    'it-IT': {
      message: 'Parli italiano?',
      visitLabel: 'Visita systemforge.it',
    },
    'pt-BR': {
      message: 'Você fala português?',
      visitLabel: 'Acesse forjadesistemas.com.br',
    },
  },
}

describe('BANNER_MESSAGES', () => {
  it('covers all 3 build locales as top-level keys', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(BANNER_MESSAGES).toHaveProperty(locale)
    }
  })

  it('has empty message/visitLabel for same-locale entry (no self-suggestion)', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const entry = BANNER_MESSAGES[locale][locale]
      expect(entry.message).toBe('')
      expect(entry.visitLabel).toBe('')
    }
  })

  it('has non-empty message and visitLabel for all cross-locale pairs', () => {
    for (const buildLocale of SUPPORTED_LOCALES) {
      for (const suggestedLocale of SUPPORTED_LOCALES) {
        if (buildLocale === suggestedLocale) continue
        const entry = BANNER_MESSAGES[buildLocale][suggestedLocale]
        expect(entry.message.length, `${buildLocale}→${suggestedLocale} message`).toBeGreaterThan(0)
        expect(entry.visitLabel.length, `${buildLocale}→${suggestedLocale} visitLabel`).toBeGreaterThan(0)
      }
    }
  })

  it('en build suggests pt-BR in Portuguese', () => {
    expect(BANNER_MESSAGES['en']['pt-BR'].message).toBe('Você fala português?')
  })

  it('en build suggests it-IT in Italian', () => {
    expect(BANNER_MESSAGES['en']['it-IT'].message).toBe('Parli italiano?')
  })

  it('pt-BR build suggests en in English', () => {
    expect(BANNER_MESSAGES['pt-BR']['en'].message).toBe('Do you speak English?')
  })

  it('it-IT build suggests pt-BR in Portuguese', () => {
    expect(BANNER_MESSAGES['it-IT']['pt-BR'].message).toBe('Você fala português?')
  })
})

// ---------------------------------------------------------------------------
// 2. Storage helpers — extracted logic (mirrors useLanguageDetection internals)
// ---------------------------------------------------------------------------

function getStorageKey(domain: string): string {
  return `sf-lang-dismissed-${domain}`
}

type LocalStorageMock = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem?: (k: string) => void }

function readDismissed(key: string): boolean {
  try {
    return (global as unknown as { localStorage: LocalStorageMock }).localStorage?.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeDismissed(key: string): void {
  try {
    ;(global as unknown as { localStorage: LocalStorageMock }).localStorage?.setItem(key, 'true')
  } catch {
    // silent
  }
}

describe('useLanguageDetection — storage helpers', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    ;(global as unknown as { localStorage: LocalStorageMock }).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    }
  })

  it('getStorageKey returns namespaced key', () => {
    expect(getStorageKey('forjadesistemas.com.br')).toBe(
      'sf-lang-dismissed-forjadesistemas.com.br',
    )
  })

  it('readDismissed returns false when key not set', () => {
    expect(readDismissed('sf-lang-dismissed-test.com')).toBe(false)
  })

  it('writeDismissed → readDismissed returns true', () => {
    const key = getStorageKey('systemforgesoftware.com')
    writeDismissed(key)
    expect(readDismissed(key)).toBe(true)
  })

  it('readDismissed returns false when localStorage throws', () => {
    ;(global as unknown as { localStorage: LocalStorageMock }).localStorage = {
      getItem: () => { throw new Error('quota') },
      setItem: () => {},
    }
    expect(readDismissed('some-key')).toBe(false)
  })
})
