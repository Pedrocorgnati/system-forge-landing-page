'use client'

import { useState, useEffect, useCallback } from 'react'

export type CookieConsent = 'accepted' | 'rejected' | null

const STORAGE_KEY = 'cookie-consent'

export function useCookieConsent() {
  const [consent, setConsentState] = useState<CookieConsent>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Ler do localStorage na montagem (client-side apenas)
  // Reading localStorage in useEffect after mount is the correct Next.js pattern
  // to avoid hydration mismatches (server has no localStorage).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CookieConsent | null
    if (stored === 'accepted' || stored === 'rejected') {
      setConsentState(stored)
    }
    setIsLoaded(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setConsent = useCallback((value: 'accepted' | 'rejected') => {
    setConsentState(value)
    localStorage.setItem(STORAGE_KEY, value)
  }, [])

  return {
    consent,
    setConsent,
    isLoaded,
    hasConsented: consent !== null,
  }
}
