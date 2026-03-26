'use client'

import { useRef, useState, useEffect } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  triggerOnce?: boolean
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLElement | null>
  isIntersecting: boolean
  hasIntersected: boolean
}

/**
 * useIntersectionObserver — detecta quando um elemento entra na viewport.
 * Usado em WhySystemForge (module-5) para triggerar contadores animados.
 * Usado em seções para animações de entrada (fade-in, slide-up).
 *
 * @param options - IntersectionObserver options
 * @returns ref para anexar ao elemento + estado de intersecção
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true })
 * return <div ref={ref} className={isIntersecting ? 'animate-fade-in' : 'opacity-0'} />
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const ref = useRef<HTMLElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  // Ref para evitar incluir hasIntersected no dep array (evita recriar observer após cada intersecção)
  const hasIntersectedRef = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting
        setIsIntersecting(intersecting)

        if (intersecting && !hasIntersectedRef.current) {
          hasIntersectedRef.current = true
          setHasIntersected(true)
          if (triggerOnce) {
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isIntersecting, hasIntersected }
}
