'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2',
          // variants
          variant === 'primary' && [
            'bg-primary text-primary-foreground border border-transparent',
            'hover:bg-primary-hover',
            'focus-visible:outline-[var(--ring)]',
          ],
          variant === 'secondary' && [
            'bg-transparent text-primary border border-primary',
            'hover:bg-primary/10',
            'focus-visible:outline-[var(--ring)]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-foreground border border-transparent',
            'hover:bg-muted',
            'focus-visible:outline-[var(--ring)]',
          ],
          variant === 'destructive' && [
            'bg-destructive text-destructive-foreground border border-transparent',
            'hover:opacity-90',
            'focus-visible:outline-destructive',
          ],
          // sizes
          size === 'sm' && 'px-3 py-1.5 text-sm rounded-lg gap-1.5 min-h-[32px]',
          size === 'md' && 'px-5 py-2.5 text-base rounded-xl gap-2 min-h-[44px]',
          size === 'lg' && 'px-7 py-3.5 text-lg rounded-xl gap-2.5 min-h-[56px]',
          // disabled
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className,
        )}
        {...props}
      >
        {loading && (
          <svg
            className="w-4 h-4 animate-spin opacity-75"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export { Button }
