'use client'

import { type CTAConfig, ConversionAction } from '@/lib/types'
import { isAllowedCTAHref } from '@/lib/cta'
import { cn } from '@/lib/utils'

interface CTAButtonProps {
  config: CTAConfig
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullWidth?: boolean
}

export function CTAButton({ config, size = 'md', className, fullWidth }: CTAButtonProps) {
  function handleClick() {
    if (!isAllowedCTAHref(config.href)) {
      console.error('ENV_004: CTA href inválido ou não permitido', config.href)
      return
    }

    // GA4 tracking (se disponível)
    if (typeof window !== 'undefined' && typeof (window as unknown as { gtag?: Function }).gtag === 'function') {
      ;(window as unknown as { gtag: Function }).gtag('event', 'cta_clicked', {
        action: config.action,
        label: config.label,
      })
    }

    window.open(config.href, '_blank', 'noopener,noreferrer')
  }

  const isWhatsApp = config.action === ConversionAction.WHATSAPP

  return (
    <button
      onClick={handleClick}
      type="button"
      data-testid={`cta-button-${config.action}`}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        // sizes
        size === 'sm' && 'px-3 py-1.5 text-sm rounded-lg gap-1.5 min-h-[32px]',
        size === 'md' && 'px-5 py-2.5 text-base rounded-xl gap-2 min-h-[44px]',
        size === 'lg' && 'px-7 py-3.5 text-lg rounded-xl gap-2.5 min-h-[56px]',
        // variants
        config.variant === 'primary' && [
          'bg-primary text-primary-foreground border border-transparent',
          'hover:bg-primary-hover shadow-sm hover:shadow-md',
        ],
        config.variant === 'secondary' && [
          'bg-transparent text-primary border border-primary',
          'hover:bg-primary/10',
        ],
        config.variant === 'ghost' && [
          'bg-transparent text-primary border border-transparent',
          'hover:bg-primary/5 underline-offset-4',
        ],
        fullWidth && 'w-full',
        className,
      )}
    >
      {isWhatsApp && config.icon && (
        <span className="mr-1" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {!isWhatsApp && config.icon && (
        <span className="mr-1" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {config.label}
    </button>
  )
}
