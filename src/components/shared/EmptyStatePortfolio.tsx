'use client'

import { FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadMessages } from '@config/content'
import { getSiteConfig } from '@config'

const messages = loadMessages()
const config = getSiteConfig()
const locale = config.locale

const viewAllLabel =
  locale === 'it-IT' ? 'Vedi tutti' : locale === 'en' ? 'View all' : 'Ver todos'

interface EmptyStatePortfolioProps {
  onReset?: () => void
}

export function EmptyStatePortfolio({ onReset }: EmptyStatePortfolioProps) {
  return (
    <div
      data-testid="empty-state-portfolio"
      className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>

      <p className="text-base font-medium text-foreground">
        {messages.empty.portfolio}
      </p>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className={cn(
            'inline-flex items-center justify-center',
            'rounded-md border border-input bg-background',
            'px-4 py-2 text-sm font-medium',
            'hover:bg-accent transition-colors',
            'min-h-[44px] min-w-[80px]',
          )}
        >
          {viewAllLabel}
        </button>
      )}
    </div>
  )
}
