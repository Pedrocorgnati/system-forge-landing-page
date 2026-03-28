/**
 * src/lib/content/types.ts
 * Types derivados dos schemas Zod via z.infer.
 *
 * Nenhuma interface ou type declarado manualmente para evitar divergência
 * entre validação em runtime e tipagem em compile time.
 * Uma mudança no schema propaga automaticamente para o type correspondente.
 */

import type {
  MessagesSchema,
  ServicesSchema,
  PortfolioSchema,
  TestimonialsSchema,
  HeroSchema,
  AboutSchema,
  AdvisorSchema,
  PrivacySchema,
  ContactSchema,
  FaqSchema,
} from './schemas'
import type { z } from 'zod'

export type Messages = z.infer<typeof MessagesSchema>
export type ServicesContent = z.infer<typeof ServicesSchema>
export type PortfolioContent = z.infer<typeof PortfolioSchema>
export type TestimonialsContent = z.infer<typeof TestimonialsSchema>
export type HeroContent = z.infer<typeof HeroSchema>
export type AboutContent = z.infer<typeof AboutSchema>
export type AdvisorContent = z.infer<typeof AdvisorSchema>
export type PrivacyContent = z.infer<typeof PrivacySchema>
export type ContactContent = z.infer<typeof ContactSchema>
export type FaqContent = z.infer<typeof FaqSchema>
