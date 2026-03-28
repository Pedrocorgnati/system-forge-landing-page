'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import type { LocaleMessages } from '@config'
import { loadMessages } from '@config/content'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CookieConsentModalProps {
  onClose: () => void
  onSave: (categories: { analytics: boolean; marketing: boolean }) => void
}

/* ------------------------------------------------------------------ */
/*  Toggle switch                                                      */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  checked,
  disabled = false,
  onChange,
  id,
}: {
  checked: boolean
  disabled?: boolean
  onChange?: (value: boolean) => void
  id: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled
          ? 'bg-muted opacity-60 cursor-not-allowed'
          : checked
            ? 'bg-primary cursor-pointer'
            : 'bg-input cursor-pointer',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          'mt-0.5 ml-0.5',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Modal                                                              */
/* ------------------------------------------------------------------ */

export function CookieConsentModal({ onClose, onSave }: CookieConsentModalProps) {
  const messages = loadMessages() as unknown as LocaleMessages
  const m = messages.cookieModal

  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus the close button on mount
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  // Escape key closes modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Simple focus trap: Tab cycles through focusable elements inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const modal = modalRef.current
      if (!modal) return

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [],
  )

  // Fallback texts when cookieModal section is missing
  const title = m?.title ?? 'Cookie Settings'
  const subtitle = m?.subtitle ?? 'Manage your cookie preferences.'
  const closeLabel = m?.close ?? 'Close'
  const necessaryLabel = m?.necessary?.label ?? 'Necessary cookies'
  const necessaryDesc = m?.necessary?.description ?? 'Essential for the site to function.'
  const necessaryBadge = m?.necessary?.badge ?? 'Always active'
  const analyticsLabel = m?.analytics?.label ?? 'Analytics cookies'
  const analyticsDesc = m?.analytics?.description ?? 'Help us understand site usage.'
  const marketingLabel = m?.marketing?.label ?? 'Marketing cookies'
  const marketingDesc = m?.marketing?.description ?? 'Used to show relevant ads.'
  const saveLabel = m?.save ?? 'Save preferences'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        data-testid="cookie-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2',
          'rounded-lg border bg-background p-6 shadow-xl',
          'overflow-y-auto max-h-[90vh]',
          'animate-in fade-in-0 zoom-in-95 duration-200',
        )}
      >
        {/* Close button */}
        <button
          data-testid="cookie-modal-close-button"
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={cn(
            'absolute top-4 right-4',
            'inline-flex h-8 w-8 items-center justify-center rounded-md',
            'text-muted-foreground hover:text-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Cookie categories */}
        <div className="space-y-5">
          {/* Necessary — always on */}
          <div data-testid="cookie-modal-necessary" className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-foreground" htmlFor="toggle-necessary">
                {necessaryLabel}
              </label>
              <p className="text-xs text-muted-foreground">{necessaryDesc}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ToggleSwitch id="toggle-necessary" checked disabled />
              <span className="text-[10px] font-medium text-muted-foreground">{necessaryBadge}</span>
            </div>
          </div>

          {/* Analytics */}
          <div data-testid="cookie-modal-analytics" className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-foreground" htmlFor="toggle-analytics">
                {analyticsLabel}
              </label>
              <p className="text-xs text-muted-foreground">{analyticsDesc}</p>
            </div>
            <ToggleSwitch
              id="toggle-analytics"
              checked={analytics}
              onChange={setAnalytics}
            />
          </div>

          {/* Marketing */}
          <div data-testid="cookie-modal-marketing" className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-foreground" htmlFor="toggle-marketing">
                {marketingLabel}
              </label>
              <p className="text-xs text-muted-foreground">{marketingDesc}</p>
            </div>
            <ToggleSwitch
              id="toggle-marketing"
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        </div>

        {/* Save */}
        <button
          data-testid="cookie-modal-save-button"
          type="button"
          onClick={() => onSave({ analytics, marketing })}
          className={cn(
            'mt-6 w-full bg-primary text-primary-foreground h-10 rounded-md',
            'text-sm font-medium transition-colors hover:bg-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          {saveLabel}
        </button>
      </div>
    </>
  )
}
