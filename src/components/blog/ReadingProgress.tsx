'use client'

import { useEffect, useState } from 'react'

/**
 * ReadingProgress — barra fina fixa no topo que reflete a profundidade de
 * leitura do artigo. position:fixed => zero CLS. Scroll com rAF-debounce.
 * SSR-safe (só toca window dentro do effect). Sinaliza progresso e reforça
 * engajamento (pareia com a revelação do WhatsApp flutuante).
 */
export function ReadingProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setPct(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0)
    }
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent pointer-events-none"
      aria-hidden="true"
      data-testid="blog-reading-progress"
    >
      <div
        className="h-full bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
