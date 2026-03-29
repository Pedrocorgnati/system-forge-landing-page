'use client'

/**
 * components/performance/WebVitalsReporter.tsx
 * Client Component mínimo que ativa o monitoramento de Web Vitals.
 * Adicionado ao layout raiz para cobertura global de LCP/CLS/INP/FCP/TTFB.
 */
import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/performance/web-vitals'

export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals()
  }, [])
  return null
}
