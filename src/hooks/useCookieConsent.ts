'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSiteConfig } from '@config'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ConsentDecision = 'accepted' | 'rejected' | 'partial' | null
type ComplianceFramework = 'LGPD' | 'GDPR' | 'CAN-SPAM'

interface ConsentState {
  decision: ConsentDecision
  categories: { analytics: boolean; marketing: boolean }
  timestamp: number | null
  framework: ComplianceFramework
}

export interface UseConsentManager {
  hasConsented: boolean
  consent: ConsentState
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  acceptAll: () => void
  rejectAll: () => void
  savePreferences: (categories: { analytics: boolean; marketing: boolean }) => void
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'sf-cookie-consent'

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
  categories: { analytics: false, marketing: false },
  timestamp: null,
  framework: 'LGPD',
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
      categories: { analytics: true, marketing: true },
      timestamp: Date.now(),
      framework: consent.framework,
    }
    setConsent(next)
    writeStorage(next)
  }, [consent.framework])

  const rejectAll = useCallback(() => {
    const next: ConsentState = {
      decision: 'rejected',
      categories: { analytics: false, marketing: false },
      timestamp: Date.now(),
      framework: consent.framework,
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
        categories,
        timestamp: Date.now(),
        framework: consent.framework,
      }
      setConsent(next)
      writeStorage(next)
      setIsModalOpen(false)
    },
    [consent.framework],
  )

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
  }
}
