'use client'

import { type CTAConfig, ConversionAction } from '@/lib/types'
import { isAllowedCTAHref } from '@/lib/cta'
import { cn } from '@/lib/utils'

interface CTAButtonProps {
  config: CTAConfig
  size?: 'sm' | 'md' | 'lg'
  variant?: CTAConfig['variant']
  className?: string
  fullWidth?: boolean
}

type Gtag = (command: string, eventName: string, params?: Record<string, unknown>) => void

export function CTAButton({ config, size = 'md', variant, className, fullWidth }: CTAButtonProps) {
  const resolvedConfig = variant ? { ...config, variant } : config

  function handleClick() {
    if (!isAllowedCTAHref(resolvedConfig.href)) {
      console.error('ENV_004: CTA href inválido ou não permitido', resolvedConfig.href)
      return
    }

    // GA4 tracking (se disponível)
    const gtag = (window as Window & { gtag?: Gtag }).gtag
    if (typeof window !== 'undefined' && typeof gtag === 'function') {
      gtag('event', 'cta_clicked', {
        action: resolvedConfig.action,
        label: resolvedConfig.label,
      })
    }

    window.open(resolvedConfig.href, '_blank', 'noopener,noreferrer')
  }

  const isWhatsApp = resolvedConfig.action === ConversionAction.WHATSAPP

  return (
    <button
      onClick={handleClick}
      type="button"
      data-testid={`cta-button-${resolvedConfig.action}`}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        // sizes
        size === 'sm' && 'px-3 py-1.5 text-sm rounded-lg gap-1.5 min-h-[32px]',
        size === 'md' && 'px-5 py-2.5 text-base rounded-xl gap-2 min-h-[44px]',
        size === 'lg' && 'px-7 py-3.5 text-lg rounded-xl gap-2.5 min-h-[56px]',
        // variants
        resolvedConfig.variant === 'primary' && [
          'bg-primary text-primary-foreground border border-transparent',
          'hover:bg-primary-hover shadow-sm hover:shadow-md',
        ],
        resolvedConfig.variant === 'secondary' && [
          'bg-transparent text-primary border border-primary',
          'hover:bg-primary/10',
        ],
        resolvedConfig.variant === 'ghost' && [
          'bg-transparent text-primary border border-transparent',
          'hover:bg-primary/5 underline-offset-4',
        ],
        fullWidth && 'w-full',
        className,
      )}
    >
      {isWhatsApp && resolvedConfig.icon && (
        <span className="mr-1" aria-hidden="true">
          {resolvedConfig.icon}
        </span>
      )}
      {!isWhatsApp && resolvedConfig.icon && (
        <span className="mr-1" aria-hidden="true">
          {resolvedConfig.icon}
        </span>
      )}
      {resolvedConfig.label}
    </button>
  )
}
