'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguageDetection } from '@/hooks/useLanguageDetection'
import {
  getSiteConfig,
  LOCALE_URLS,
  type SupportedLocale,
} from '@config'

/**
 * Mensagens por locale do build, endereçadas ao locale sugerido.
 * Cada build mostra mensagens nos idiomas dos OUTROS domínios.
 */
const BANNER_MESSAGES: Record<
  SupportedLocale,
  Record<SupportedLocale, { message: string; visitLabel: string }>
> = {
  'pt-BR': {
    'pt-BR': { message: '', visitLabel: '' },
    'en': {
      message: 'Do you speak English?',
      visitLabel: 'Visit systemforgesoftware.com',
    },
    'it-IT': {
      message: 'Parli italiano?',
      visitLabel: 'Visita systemforge.it',
    },
  },
  'it-IT': {
    'it-IT': { message: '', visitLabel: '' },
    'pt-BR': {
      message: 'Você fala português?',
      visitLabel: 'Acesse forjadesistemas.com.br',
    },
    'en': {
      message: 'Do you speak English?',
      visitLabel: 'Visit systemforgesoftware.com',
    },
  },
  'en': {
    'en': { message: '', visitLabel: '' },
    'it-IT': {
      message: 'Parli italiano?',
      visitLabel: 'Visita systemforge.it',
    },
    'pt-BR': {
      message: 'Você fala português?',
      visitLabel: 'Acesse forjadesistemas.com.br',
    },
  },
}

export function LanguageSuggestionBanner() {
  const config = getSiteConfig()
  const buildLocale = config.locale
  const closeLabel = buildLocale === 'it-IT' ? 'Chiudi suggerimento lingua'
    : buildLocale === 'en' ? 'Close language suggestion'
    : 'Fechar sugestão de idioma'
  const { suggestedLocale, isDismissed, dismiss } = useLanguageDetection(
    config.domain,
  )
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  // No SSR render — prevents flash
  if (!mounted) return null
  if (!suggestedLocale || isDismissed) return null

  const entry = BANNER_MESSAGES[buildLocale]?.[suggestedLocale]
  if (!entry || !entry.message) return null

  const href = LOCALE_URLS[suggestedLocale]

  return (
    <div
      data-testid="language-suggestion-banner"
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed top-0 left-0 right-0 z-[60]',
        'bg-primary text-primary-foreground',
        'animate-in fade-in duration-300',
      )}
    >
      <div
        className={cn(
          'max-w-7xl mx-auto px-4 py-3',
          'flex flex-col gap-3',
          'md:flex-row md:items-center md:justify-between md:gap-4',
        )}
      >
        {/* Message */}
        <p className="text-sm font-medium">
          {entry.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            data-testid="language-suggestion-visit-link"
            href={href}
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center justify-center',
              'bg-white text-primary hover:bg-muted',
              'rounded-md px-4 py-2 text-sm font-medium',
              'min-h-[44px] transition-colors',
            )}
          >
            {entry.visitLabel}
          </a>

          <button
            data-testid="language-suggestion-close-button"
            type="button"
            onClick={dismiss}
            aria-label={closeLabel}
            className={cn(
              'inline-flex items-center justify-center',
              'text-primary-foreground/80 hover:text-primary-foreground',
              'rounded-md p-2 min-h-[44px] min-w-[44px]',
              'transition-colors',
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
