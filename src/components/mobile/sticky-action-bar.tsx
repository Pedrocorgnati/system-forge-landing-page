'use client'

import { cn } from '@/lib/utils'

interface StickyActionBarProps {
  children: React.ReactNode
  className?: string
  visible?: boolean
}

export function StickyActionBar({ children, className, visible = true }: StickyActionBarProps) {
  if (!visible) return null

  return (
    <div
      data-testid="sticky-action-bar"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-20 md:hidden',
        'bg-background border-t border-border',
        'px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
        'shadow-[0_-2px_8px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
