'use client'

import { cn } from '@/lib/utils'

interface ChipOption {
  label: string
  value: string
}

interface ScrollableChipsProps {
  options: ChipOption[]
  selected?: string
  onSelect: (value: string) => void
  className?: string
}

export function ScrollableChips({ options, selected, onSelect, className }: ScrollableChipsProps) {
  return (
    <div
      data-testid="scrollable-chips"
      className={cn(
        'flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory',
        'pb-2 -mb-2',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          data-testid={`chip-${option.value}`}
          className={cn(
            'snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium',
            'min-h-[44px] min-w-[80px]',
            'transition-colors touch-manipulation',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
            selected === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-accent',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
