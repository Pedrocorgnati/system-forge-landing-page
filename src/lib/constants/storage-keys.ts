/**
 * lib/constants/storage-keys.ts
 * Chaves do localStorage centralizadas para evitar colisões e facilitar auditoria.
 */

export const STORAGE_KEYS = {
  /** Preferências de consentimento de cookies (LGPD/GDPR) */
  COOKIE_CONSENT: 'sf-cookie-consent',

  /** Tema selecionado pelo usuário ('light' | 'dark') */
  THEME: 'theme',

  /** Indicador de que o banner de idioma foi dispensado para um dado domínio */
  langDismissed: (domain: string): string => `sf-lang-dismissed-${domain}`,
} as const
