'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SupportedLocale } from '@config'

/**
 * Mapa de prefixos de locale do navegador para SupportedLocale.
 * Ordem: mais especifico primeiro.
 */
const LOCALE_MAP: Array<[string, SupportedLocale]> = [
  ['pt-BR', 'pt-BR'],
  ['pt', 'pt-BR'],
  ['it-IT', 'it-IT'],
  ['it', 'it-IT'],
  ['en', 'en'],
]

function detectLocaleFromBrowser(): SupportedLocale | null {
  if (typeof navigator === 'undefined') return null

  const browserLocales: readonly string[] =
    navigator.languages?.length > 0
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : []

  for (const browserLocale of browserLocales) {
    const normalized = browserLocale.trim()
    for (const [prefix, mapped] of LOCALE_MAP) {
      if (
        normalized === prefix ||
        normalized.toLowerCase() === prefix.toLowerCase()
      ) {
        return mapped
      }
    }
  }

  // Fallback: match by primary subtag
  for (const browserLocale of browserLocales) {
    const primary = browserLocale.split('-')[0].toLowerCase()
    for (const [prefix, mapped] of LOCALE_MAP) {
      if (prefix.split('-')[0].toLowerCase() === primary) {
        return mapped
      }
    }
  }

  return null
}

function getStorageKey(domain: string): string {
  return `sf-lang-dismissed-${domain}`
}

function readDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}

function writeDismissed(key: string): void {
  try {
    localStorage.setItem(key, 'true')
  } catch {
    // silently ignore — in-memory state is the fallback
  }
}

export interface UseLanguageDetectionResult {
  suggestedLocale: SupportedLocale | null
  isDismissed: boolean
  dismiss: () => void
}

/**
 * Hook que detecta o idioma do navegador e sugere troca de dominio.
 * Nunca faz auto-redirect.
 */
export function useLanguageDetection(
  domain: string,
): UseLanguageDetectionResult {
  const buildLocale = (process.env.NEXT_PUBLIC_LOCALE ?? 'pt-BR') as SupportedLocale
  const storageKey = getStorageKey(domain)

  const [isDismissed, setIsDismissed] = useState(true) // start dismissed to avoid flash
  const [suggestedLocale, setSuggestedLocale] = useState<SupportedLocale | null>(null)

  useEffect(() => {
    const dismissed = readDismissed(storageKey)
    setIsDismissed(dismissed)

    if (!dismissed) {
      const detected = detectLocaleFromBrowser()
      if (detected && detected !== buildLocale) {
        setSuggestedLocale(detected)
      }
    }
  }, [storageKey, buildLocale])

  const dismiss = useCallback(() => {
    setIsDismissed(true)
    writeDismissed(storageKey)
  }, [storageKey])

  return { suggestedLocale, isDismissed, dismiss }
}
