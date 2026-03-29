'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TIMING } from '@/lib/constants/timing'

/**
 * DevDataTestOverlay — Overlay visual de debug para data-testid
 *
 * SOMENTE para ambiente de desenvolvimento.
 * Este componente NUNCA deve aparecer em producao.
 *
 * Funcionalidade:
 * - Botao flutuante [data-test] arrastavel (grab handle)
 * - Ao clicar, exibe overlays com todos os data-testid do DOM
 * - Ao clicar em um overlay, copia o data-testid para o clipboard
 * - Segundo clique no botao esconde todos os overlays
 */

export function DevDataTestOverlay() {
  const [isActive, setIsActive] = useState(false)
  const [elements, setElements] = useState<Array<{ id: string; rect: DOMRect }>>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const isDevelopment = process.env.NODE_ENV === 'development'

  const btnRef = useRef<HTMLButtonElement>(null)
  const dragRef = useRef(false)
  const hasMoved = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })

  const scanDataTestIds = useCallback(() => {
    const allElements = document.querySelectorAll('[data-testid]')
    const mapped = Array.from(allElements).map((el) => ({
      id: el.getAttribute('data-testid')!,
      rect: el.getBoundingClientRect(),
    }))
    setElements(mapped)
  }, [])

  const handleToggle = useCallback(() => {
    if (hasMoved.current) return
    if (!isActive) {
      scanDataTestIds()
    }
    setIsActive((prev) => !prev)
  }, [isActive, scanDataTestIds])

  const handleCopy = useCallback(async (testId: string) => {
    const copyText = `data-testid="${testId}"`
    try {
      await navigator.clipboard.writeText(copyText)
      setCopiedId(testId)
      setTimeout(() => setCopiedId(null), TIMING.COPY_FEEDBACK)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = copyText
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedId(testId)
      setTimeout(() => setCopiedId(null), TIMING.COPY_FEEDBACK)
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const btn = e.currentTarget as HTMLElement
    btn.setPointerCapture(e.pointerId)
    const rect = btn.getBoundingClientRect()
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    dragRef.current = true
    hasMoved.current = false
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    hasMoved.current = true
    const btn = btnRef.current
    if (!btn) return
    const btnWidth = btn.offsetWidth
    const newLeft = e.clientX - offsetRef.current.x
    const newTop = e.clientY - offsetRef.current.y
    btn.style.top = `${Math.max(0, newTop)}px`
    btn.style.right = 'auto'
    btn.style.left = `${Math.max(0, Math.min(window.innerWidth - btnWidth, newLeft))}px`
    btn.style.transition = 'none'
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = false
    const btn = btnRef.current
    if (btn) {
      btn.style.transition = 'background-color 150ms ease, color 150ms ease, border-color 150ms ease'
    }
  }, [])

  // Atualizar posicoes no scroll e resize
  useEffect(() => {
    if (!isActive) return

    const handleUpdate = () => scanDataTestIds()

    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isActive, scanDataTestIds])

  if (!isDevelopment) {
    return null
  }

  return (
    <>
      {/* Botao flutuante arrastavel */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          zIndex: 99999,
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'monospace',
          border: '2px solid',
          borderColor: isActive ? '#ffffff' : '#ef4444',
          borderRadius: '6px',
          backgroundColor: isActive ? '#ef4444' : '#ffffff',
          color: isActive ? '#ffffff' : '#ef4444',
          cursor: 'grab',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
          userSelect: 'none',
          touchAction: 'none',
        }}
        aria-label={isActive ? 'Esconder data-testid overlays' : 'Mostrar data-testid overlays'}
      >
        ⠿ [data-test]
      </button>

      {/* Overlays dos data-testid */}
      {isActive &&
        elements.map((el) => (
          <button
            key={`${el.id}-${el.rect.top}-${el.rect.left}`}
            onClick={() => handleCopy(el.id)}
            title={`Clique para copiar: ${el.id}`}
            style={{
              position: 'fixed',
              top: `${el.rect.top}px`,
              left: `${el.rect.left}px`,
              zIndex: 99998,
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 600,
              fontFamily: 'monospace',
              backgroundColor: copiedId === el.id ? '#16a34a' : '#ef4444',
              color: '#ffffff',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'background-color 150ms ease',
              lineHeight: '1.4',
            }}
          >
            {copiedId === el.id ? 'Copiado!' : el.id}
          </button>
        ))}
    </>
  )
}
