/**
 * lib/data/testimonials.ts
 * Depoimentos de clientes da SystemForge.
 * Fonte de dados: content/pt-BR/pages/testimonials.json
 * Nota: Lucia Ferrari (it-IT) está em content/it-IT/pages/testimonials.json, não aqui.
 */
import testimonialsJson from '../../../content/pt-BR/pages/testimonials.json'
import type { Testimonial } from '../types'

export const testimonials: Testimonial[] = testimonialsJson.map(item => ({
  id: item.id,
  author: item.author,
  name: item.author,
  content: item.content,
  text: item.content,
  role: item.role,
  company: item.company,
}))
