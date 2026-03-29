'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadMessages } from '@config/content'

const m = loadMessages()

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  snapPoint?: '30' | '60' | '90'
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoint = '60',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const snapHeights: Record<string, string> = {
    '30': 'max-h-[30vh]',
    '60': 'max-h-[60vh]',
    '90': 'max-h-[90vh]',
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
        data-testid="bottom-sheet"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background rounded-t-xl',
          'pb-[env(safe-area-inset-bottom)]',
          'animate-in slide-in-from-bottom',
          snapHeights[snapPoint],
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-md',
                'text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
              )}
              aria-label={m.accessibility.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </>
  )
}
