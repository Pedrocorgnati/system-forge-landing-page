import { z } from 'zod'

export const SOFTWARE_TYPES = ['sob-medida', 'erp-nichado', 'automacao-ia', 'outro'] as const
export const URGENCIES = ['1-mes', '3-meses', '6-mais-meses', 'explorando'] as const
export const BUDGETS = ['ate-50k', '50-150k', '150-300k', '300k-mais'] as const
export const CHANNELS = ['whatsapp', 'email', 'call'] as const

export type SoftwareType = (typeof SOFTWARE_TYPES)[number]
export type Urgency = (typeof URGENCIES)[number]
export type Budget = (typeof BUDGETS)[number]
export type Channel = (typeof CHANNELS)[number]

export const Passo1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'form.errors.fullName.min' })
    .max(120, { message: 'form.errors.fullName.max' }),
  email: z
    .string()
    .trim()
    .email({ message: 'form.errors.email.format' })
    .max(254, { message: 'form.errors.email.max' }),
  company: z
    .string()
    .trim()
    .min(1, { message: 'form.errors.company.required' })
    .max(160, { message: 'form.errors.company.max' }),
})

export const Passo2Schema = z.object({
  softwareType: z.enum(SOFTWARE_TYPES, {
    errorMap: () => ({ message: 'form.errors.softwareType.required' }),
  }),
  urgency: z.enum(URGENCIES, {
    errorMap: () => ({ message: 'form.errors.urgency.required' }),
  }),
  budget: z.enum(BUDGETS, {
    errorMap: () => ({ message: 'form.errors.budget.required' }),
  }),
  channel: z.enum(CHANNELS, {
    errorMap: () => ({ message: 'form.errors.channel.required' }),
  }),
  lgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'form.errors.lgpdConsent.required' }),
  }),
})

export const LeadPayloadSchema = Passo1Schema.merge(Passo2Schema)

export type Passo1Values = z.infer<typeof Passo1Schema>
export type Passo2Values = z.infer<typeof Passo2Schema>
export type LeadPayload = z.infer<typeof LeadPayloadSchema>
