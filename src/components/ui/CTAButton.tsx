'use client'

import { type CTAConfig, ConversionAction } from '@/lib/types'
import { isAllowedCTAHref } from '@/lib/cta'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { trackEvent } from '@/lib/analytics'
import { GA4_EVENTS } from '@/lib/constants/analytics'
import { capture as posthogCapture } from '@/lib/tracking/posthog'

interface CTAButtonProps {
  config: CTAConfig
  size?: 'sm' | 'md' | 'lg'
  variant?: CTAConfig['variant']
  className?: string
  fullWidth?: boolean
}

export function CTAButton({ config, size = 'md', variant, className, fullWidth }: CTAButtonProps) {
  const resolvedConfig = variant ? { ...config, variant } : config

  function handleClick() {
    if (!isAllowedCTAHref(resolvedConfig.href)) {
      logger.warn('ENV_004: CTA href inválido ou não permitido', { action: 'cta-click' })
      return
    }

    // GA4 tracking
    trackEvent(GA4_EVENTS.CTA_CLICKED, {
      action: resolvedConfig.action,
      label: resolvedConfig.label,
    })

    const isEmail = resolvedConfig.action === ConversionAction.EMAIL
    const posthogEvent =
      resolvedConfig.action === ConversionAction.WHATSAPP
        ? 'whatsapp_click'
        : isEmail
          ? 'email_click'
          : resolvedConfig.variant === 'primary'
            ? 'cta_primary_click'
            : 'cta_secondary_click'
    posthogCapture(posthogEvent, {
      source: 'cta_button',
      action: resolvedConfig.action,
      label: resolvedConfig.label,
    })

    // mailto: numa nova aba deixaria uma aba em branco — navega no mesmo contexto.
    if (isEmail) {
      window.location.href = resolvedConfig.href
    } else {
      window.open(resolvedConfig.href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      data-testid={`cta-button-${resolvedConfig.action}`}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        // sizes
        size === 'sm' && 'px-3 py-1.5 text-sm rounded-lg gap-1.5 min-h-[44px]',
        size === 'md' && 'px-5 py-2.5 text-base rounded-xl gap-2 min-h-[44px]',
        size === 'lg' && 'px-7 py-3.5 text-lg rounded-xl gap-2.5 min-h-[56px]',
        // variants
        'active:scale-[0.98]',
        resolvedConfig.variant === 'primary' && [
          'bg-primary text-primary-foreground border border-transparent',
          'shadow-sm hover:bg-primary-hover hover:shadow-md hover:-translate-y-px',
        ],
        resolvedConfig.variant === 'secondary' && [
          'bg-primary/5 text-primary border border-primary',
          'hover:bg-primary hover:text-primary-foreground hover:shadow-sm',
        ],
        resolvedConfig.variant === 'ghost' && [
          'bg-transparent text-muted-foreground border border-border',
          'hover:bg-accent hover:text-foreground hover:border-foreground/20',
        ],
        fullWidth && 'w-full',
        className,
      )}
    >
      {resolvedConfig.icon && (
        <span className="mr-1" aria-hidden="true">
          {resolvedConfig.icon}
        </span>
      )}
      {resolvedConfig.label}
    </button>
  )
}
