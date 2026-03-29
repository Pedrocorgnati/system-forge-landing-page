/**
 * lib/performance/web-vitals.ts
 * Web Vitals reporter para monitoramento de LCP, CLS, INP, FCP, TTFB.
 * Ativado no layout raiz via WebVitalsReporter (Client Component).
 */
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals'

interface VitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
}

function sendVital(metric: VitalMetric) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms — ${metric.rating}`)
  }

  // Para enviar para analytics em produção, descomentar e adaptar:
  // if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
  //   navigator.sendBeacon('/api/vitals', JSON.stringify(metric))
  // }
}

export function reportWebVitals() {
  onCLS(sendVital)
  onINP(sendVital)
  onLCP(sendVital)
  onFCP(sendVital)
  onTTFB(sendVital)
}
