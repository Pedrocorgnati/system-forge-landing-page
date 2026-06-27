'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { cn } from '@/lib/utils'
import { TIMING } from '@/lib/constants/timing'
import { MultibackendLogin } from '@/components/auth/MultibackendLogin'

const config = getSiteConfig()
const messages = loadMessages()

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const locale = config.locale
const DRAWER_LABEL = locale === 'it-IT' ? 'Menu di navigazione'
  : locale === 'en' ? 'Navigation menu'
  : locale === 'es-ES' ? 'Menú de navegación'
  : 'Menu de navegação'
const DRAWER_TITLE = 'Menu'

export function MobileNav({ isOpen, onClose, triggerRef }: MobileNavProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const focusTimer = setTimeout(() => firstLinkRef.current?.focus(), TIMING.FOCUS_DELAY)
      return () => {
        clearTimeout(focusTimer)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        triggerRef.current?.focus()
        return
      }

      if (e.key !== 'Tab') return

      const drawer = document.querySelector('[data-testid="mobile-nav-drawer"]') as HTMLElement | null
      if (!drawer) return

      const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelectors))
      if (focusable.length === 0) return

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
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
        aria-label={DRAWER_LABEL}
        data-testid="mobile-nav-drawer"
        className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background shadow-xl animate-slide-in-right"
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="text-xl font-bold text-primary">{DRAWER_TITLE}</span>
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
            aria-label={messages.accessibility.closeMenu}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav>
          <ul className="py-2">
            {config.navigation.map((link, index) => (
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

        {/* Login OIDC multibackend dentro do menu mobile (R-26/F-6): markup em
            ambos (header desktop + drawer), script/estado sincronizados (R-24). */}
        <div className="px-4 py-3 border-t border-border">
          <MultibackendLogin variant="mobile" />
        </div>
      </div>
    </>
  )
}
