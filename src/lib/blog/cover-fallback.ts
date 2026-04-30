/**
 * src/lib/blog/cover-fallback.ts
 * Pool de capas neutras para artigos do blog cuja `coverImage` aponta
 * para um arquivo ausente. O picker e deterministico por slug para
 * manter consistencia entre SSR e cliente (sem hydration mismatch) e
 * para que o mesmo post mostre sempre a mesma imagem.
 */

export const NEUTRAL_COVER_FALLBACKS = [
  '/images/blog/fallbacks/neutral-1.png',
  '/images/blog/fallbacks/neutral-2.png',
  '/images/blog/fallbacks/neutral-3.png',
  '/images/blog/fallbacks/neutral-4.png',
  '/images/blog/fallbacks/neutral-5.png',
  '/images/blog/fallbacks/neutral-6.png',
  '/images/blog/fallbacks/neutral-7.png',
  '/images/blog/fallbacks/neutral-8.png',
] as const

export const LAST_RESORT_COVER = '/images/blog/default-cover.png'

function hashSlug(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getCoverFallback(slug: string | undefined | null): string {
  if (!slug) return NEUTRAL_COVER_FALLBACKS[0]!
  const idx = hashSlug(slug) % NEUTRAL_COVER_FALLBACKS.length
  return NEUTRAL_COVER_FALLBACKS[idx]!
}
