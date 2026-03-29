import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getLocale } from '@config'
import type { SupportedLocale } from '@config/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  'pt-BR': 'pt-BR',
  'it-IT': 'it-IT',
  'en': 'en-US',
}

/**
 * Formata uma data para exibição no locale do build atual.
 * @param date - string ISO ou objeto Date
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const locale = DATE_LOCALE_MAP[getLocale()] ?? 'pt-BR'
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
