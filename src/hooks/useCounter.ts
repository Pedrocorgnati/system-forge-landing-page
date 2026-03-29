'use client'

import { useState, useEffect } from 'react'

/**
 * useCounter — anima um número de 0 até target quando active=true.
 * Respeita prefers-reduced-motion: salta diretamente para o valor final.
 *
 * @param target - valor final do contador
 * @param active - dispara a animação quando true
 * @returns valor atual animado
 *
 * @example
 * const count = useCounter(metric.target, isVisible)
 */
export function useCounter(target: number, active: boolean): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setCount(target))
      return () => cancelAnimationFrame(id)
    }
    const duration = target >= 50 ? 1400 : 1000
    let rafId = 0
    const step = (timestamp: number, startTime: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) {
        rafId = requestAnimationFrame((t) => step(t, startTime))
      }
    }
    rafId = requestAnimationFrame((t) => step(t, t))
    return () => cancelAnimationFrame(rafId)
  }, [active, target])

  return count
}
