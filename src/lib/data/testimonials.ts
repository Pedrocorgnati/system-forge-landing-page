/**
 * lib/data/testimonials.ts
 * Depoimentos de clientes da SystemForge, resolvidos por locale do build.
 * Fonte de dados: content/{locale}/pages/testimonials.json (4 catalogos traduzidos).
 * Locale fixo por build (NEXT_PUBLIC_LOCALE) resolvido via getLocale().
 * Antes este modulo importava apenas o JSON pt-BR, o que reintroduzia portugues
 * nos builds it/en/es para qualquer consumidor do barrel `@/lib/data/`.
 */
import { getLocale, type SupportedLocale } from '@config'
import testimonialsBr from '../../../content/pt-BR/pages/testimonials.json'
import testimonialsIt from '../../../content/it-IT/pages/testimonials.json'
import testimonialsEn from '../../../content/en/pages/testimonials.json'
import testimonialsEs from '../../../content/es-ES/pages/testimonials.json'
import type { Testimonial } from '../types'

const TESTIMONIALS_BY_LOCALE: Record<SupportedLocale, Testimonial[]> = {
  'pt-BR': testimonialsBr,
  'it-IT': testimonialsIt,
  'en': testimonialsEn,
  'es-ES': testimonialsEs,
}

export const testimonials: Testimonial[] = TESTIMONIALS_BY_LOCALE[getLocale()].map(item => ({
  id: item.id,
  author: item.author,
  name: item.author,
  content: item.content,
  text: item.content,
  role: item.role,
  company: item.company,
}))
