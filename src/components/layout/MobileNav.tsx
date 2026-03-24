'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

export function MobileNav({ isOpen, onClose, triggerRef }: MobileNavProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // Focus no primeiro link ao abrir
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => firstLinkRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fechar com ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => {
          onClose()
          triggerRef.current?.focus()
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        data-testid="mobile-nav-drawer"
        className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background shadow-xl animate-slide-in-right"
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="text-xl font-bold text-primary">Menu</span>
          <button
            data-testid="mobile-nav-close-button"
            onClick={() => {
              onClose()
              triggerRef.current?.focus()
            }}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-md',
              'text-foreground hover:bg-accent transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
            )}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav>
          <ul className="py-2">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href}>
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={link.href}
                  data-testid={`mobile-nav-item-${link.href.replace(/^\//, '') || 'home'}`}
                  onClick={() => {
                    onClose()
                    triggerRef.current?.focus()
                  }}
                  className={cn(
                    'block px-4 py-3 min-h-[44px] text-foreground',
                    'hover:bg-accent transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                    'flex items-center',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
