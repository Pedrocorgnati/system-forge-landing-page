'use client'

import { Search } from 'lucide-react'
import { loadMessages } from '@config/content'

const messages = loadMessages()

interface EmptyStateSearchProps {
  query?: string
  onClear?: () => void
}

export function EmptyStateSearch({ query, onClear }: EmptyStateSearchProps) {
  const rawMessage = messages.empty.search
  const message = query
    ? rawMessage.replace('{query}', query)
    : rawMessage.replace(' "{query}"', '').replace(' "{query}."', '.')

  return (
    <div
      data-testid="empty-state-search"
      className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>

      <p className="text-base font-medium text-foreground">
        {message}
      </p>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary hover:underline min-h-[44px] transition-colors"
        >
          {messages.cta.services}
        </button>
      )}
    </div>
  )
}
