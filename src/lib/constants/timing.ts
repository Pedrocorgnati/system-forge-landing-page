/**
 * lib/constants/timing.ts
 * Magic numbers de tempo centralizados: timers, debounce, delays de animação.
 */

export const TIMING = {
  /** Intervalo do autoplay do carrossel de depoimentos (ms) */
  CAROUSEL_AUTOPLAY: 5_000,

  /** Duração do feedback visual após copiar para clipboard (ms) */
  COPY_FEEDBACK: 1_500,

  /** Delay de focus no primeiro item ao abrir drawer/modal (ms) */
  FOCUS_DELAY: 50,

  /** Debounce da busca de artigos no blog (ms) */
  SEARCH_DEBOUNCE: 500,

  /** Multiplicador de delay entre estrelas da animação de rating (ms × index) */
  STAR_ANIMATION_STEP: 60,
} as const
