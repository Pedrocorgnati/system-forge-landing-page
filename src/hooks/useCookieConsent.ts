'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSiteConfig } from '@config'
import type { ConsentDecision, ComplianceFramework, ConsentState } from '@/types/consent.types'
import { STORAGE_KEYS } from '@/lib/constants/storage-keys'

export interface UseConsentManager {
  hasConsented: boolean
  consent: ConsentState
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (categories: { analytics: boolean; marketing: boolean }) => void
  resetConsent: () => void
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = STORAGE_KEYS.COOKIE_CONSENT

/** GDPR Art. 7 — consent expires after 13 months (395 days). */
const EXPIRATION_MS = 395 * 24 * 60 * 60 * 1000

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveFramework(): ComplianceFramework {
  return getSiteConfig().compliance
}

function readStorage(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState & { timestamp: number }

    // Invalidate consent with mismatched schema version
    if (parsed.version !== '1.0') {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    // Expire stale consent
    if (parsed.timestamp && Date.now() - parsed.timestamp > EXPIRATION_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function writeStorage(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Silently handle quota / privacy errors
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const DEFAULT_STATE: ConsentState = {
  decision: null,
  categories: { essential: true, analytics: false, marketing: false },
  timestamp: null,
  framework: 'LGPD',
  version: '1.0',
}

export function useCookieConsent(): UseConsentManager {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_STATE)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Hydrate from localStorage after mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const framework = resolveFramework()
    const stored = readStorage()
    if (stored) {
      setConsent({ ...stored, framework })
    } else {
      setConsent((prev) => ({ ...prev, framework }))
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const acceptAll = useCallback(() => {
    const next: ConsentState = {
      decision: 'accepted',
      categories: { essential: true, analytics: true, marketing: true },
      timestamp: Date.now(),
      framework: consent.framework,
      version: '1.0',
    }
    setConsent(next)
    writeStorage(next)
  }, [consent.framework])

  const rejectAll = useCallback(() => {
    const next: ConsentState = {
      decision: 'rejected',
      categories: { essential: true, analytics: false, marketing: false },
      timestamp: Date.now(),
      framework: consent.framework,
      version: '1.0',
    }
    setConsent(next)
    writeStorage(next)
  }, [consent.framework])

  const savePreferences = useCallback(
    (categories: { analytics: boolean; marketing: boolean }) => {
      const allAccepted = categories.analytics && categories.marketing
      const allRejected = !categories.analytics && !categories.marketing
      const decision: ConsentDecision = allAccepted
        ? 'accepted'
        : allRejected
          ? 'rejected'
          : 'partial'

      const next: ConsentState = {
        decision,
        categories: { essential: true, ...categories },
        timestamp: Date.now(),
        framework: consent.framework,
        version: '1.0',
      }
      setConsent(next)
      writeStorage(next)
      setIsModalOpen(false)
    },
    [consent.framework],
  )

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Silently handle storage errors
    }
    setConsent({ ...DEFAULT_STATE, framework: consent.framework })
  }, [consent.framework])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  return {
    hasConsented: consent.decision !== null,
    consent,
    isModalOpen,
    openModal,
    closeModal,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
  }
}
