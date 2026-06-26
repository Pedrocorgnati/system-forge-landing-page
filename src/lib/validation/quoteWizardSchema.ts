import { z } from 'zod'

// Espelha o backend `freeQuoteSchema`
// (systemforge-dashboard/src/lib/schemas/quote.ts). Valores literais replicados
// 1:1: qualquer drift de enum aqui faz o submit 400ar no ingest server-to-server.
const WHATSAPP_REGEX = /^[+\d][\d\s().-]{6,19}$/

export const PROJECT_TYPES = ['web', 'mobile', 'ai', 'other'] as const
export const BUDGET_RANGES = [
  'under1k',
  '1k-5k',
  'under5k',
  '5k-15k',
  '15k-50k',
  '50k-plus',
  'not-sure',
] as const
export const TIMELINES = ['asap', '1-3months', '3-6months', '6-plus', 'flexible'] as const

export type ProjectType = (typeof PROJECT_TYPES)[number]
export type BudgetRange = (typeof BUDGET_RANGES)[number]
export type Timeline = (typeof TIMELINES)[number]

// Mapa card (`serviceId`) -> `projectType`. Fonte canonica:
// ai-forge/blueprints/quote-lead-wizard.md. Sem este mapa o id cru do card vaza
// para o payload e o submit 400a. Chaveado por id (Record), NUNCA por indice
// (indice quebra com reorder/novos cards). 9 serviceIds -> 4 projectTypes.
export const SERVICE_ID_TO_TYPE: Record<string, ProjectType> = {
  'landing-page': 'web',
  'web-app': 'web',
  'mobile-app': 'mobile',
  'e-commerce': 'web',
  'api-backend': 'ai',
  'contrato-pj': 'other',
  'sistema-gestao': 'web',
  'chatbots-ia': 'ai',
  other: 'other',
}

export const quoteWizardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'form.errors.name.min' }),
  email: z
    .string()
    .trim()
    .email({ message: 'form.errors.email.format' }),
  whatsapp: z
    .string()
    .trim()
    .min(8, { message: 'form.errors.whatsapp.min' })
    .max(20, { message: 'form.errors.whatsapp.max' })
    .regex(WHATSAPP_REGEX, { message: 'form.errors.whatsapp.format' }),
  projectType: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: 'form.errors.projectType.required' }),
  }),
  description: z
    .string()
    .trim()
    .min(20, { message: 'form.errors.description.min' })
    .max(2000, { message: 'form.errors.description.max' }),
  budgetRange: z.enum(BUDGET_RANGES, {
    errorMap: () => ({ message: 'form.errors.budgetRange.required' }),
  }),
  timeline: z.enum(TIMELINES, {
    errorMap: () => ({ message: 'form.errors.timeline.required' }),
  }),
  features: z.array(z.string()).optional(),
  referralSource: z.string().optional(),
})

export type QuoteWizardValues = z.infer<typeof quoteWizardSchema>
