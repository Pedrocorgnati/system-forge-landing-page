/**
 * src/lib/content/schemas.ts
 * 10 schemas Zod para validação dos arquivos JSON da content layer.
 *
 * Responsabilidade exclusiva de validação e parsing via Zod.
 * Nenhuma lógica de negócio ou carregamento de arquivos aqui.
 *
 * NOTA: ServiceCategory e DeliveryCountry são const objects (não TypeScript enums nativos).
 * Por isso usa-se z.enum(Object.values(...)) em vez de z.nativeEnum().
 * Valores duplicados (BOTS/CHATBOT, LANDING/LANDING_PAGE) são deduplicados com Set.
 */

import { z } from 'zod'
import { ServiceCategory, DeliveryCountry } from '../types'

// Helpers para z.enum com const objects — deduplicados com Set
const serviceCategoryValues = [
  ...new Set(Object.values(ServiceCategory)),
] as [string, ...string[]]

const deliveryCountryValues = Object.values(DeliveryCountry) as [string, ...string[]]

// ─── 1. MessagesSchema ────────────────────────────────────────────────────────
// Para content/{locale}/pages/messages.json
// Cobre strings de seções (grupos do Escopo) e UI strings globais
export const MessagesSchema = z.object({
  hero: z.object({
    titulo: z.string().min(1),
    subtitulo: z.string().min(1),
    cta_primary: z.string().min(1),
    cta_secondary: z.string().min(1),
  }),
  services: z.object({
    titulo_secao: z.string().min(1),
    subtitulo: z.string().min(1),
    cta_ver_mais: z.string().min(1),
    cta_orcamento: z.string().min(1),
    empty_state: z.string().min(1),
  }),
  portfolio: z.object({
    titulo_secao: z.string().min(1),
    subtitulo: z.string().min(1),
    cta_ver_projeto: z.string().min(1),
    filtro_todos: z.string().min(1),
  }),
  testimonials: z.object({
    titulo_secao: z.string().min(1),
    subtitulo: z.string().min(1),
    cta_ver_todos: z.string().min(1),
  }),
  newsletter: z.object({
    titulo: z.string().min(1),
    subtitulo: z.string().min(1),
    placeholder_email: z.string().min(1),
    cta_assinar: z.string().min(1),
    msg_sucesso: z.string().min(1),
  }),
  contact: z.object({
    titulo_secao: z.string().min(1),
    subtitulo: z.string().min(1),
    cta_whatsapp: z.string().min(1),
    cta_calendly: z.string().min(1),
    cta_email: z.string().min(1),
  }),
  common: z.object({
    voltar: z.string().min(1),
    ler_mais: z.string().min(1),
    carregando: z.string().min(1),
    erro_generico: z.string().min(1),
    sem_resultados: z.string().min(1),
    fechar: z.string().min(1),
  }),
})

// ─── 2. ServicesSchema ────────────────────────────────────────────────────────
// Para content/{locale}/pages/services.json
// Usa z.enum com valores do const ServiceCategory (não z.nativeEnum)
export const ServicesSchema = z.array(
  z.object({
    id: z.string().min(1),
    category: z.enum(serviceCategoryValues),
    title: z.string().min(1),
    description: z.string().min(1),
    features: z.array(z.string().min(1)),
  })
)

// ─── 3. PortfolioSchema ───────────────────────────────────────────────────────
// Para content/{locale}/pages/portfolio.json
// categories: array com min(1) — usa z.enum deduplicado com Set
// deliveryCountry: z.enum com valores de DeliveryCountry const
export const PortfolioSchema = z.array(
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    categories: z.array(z.enum(serviceCategoryValues)).min(1),
    technologies: z.array(z.string().min(1)),
    deliveryCountry: z.enum(deliveryCountryValues).optional(),
    imageUrl: z.string().optional(),
    projectUrl: z.string().optional(),
  })
)

// ─── 4. TestimonialsSchema ────────────────────────────────────────────────────
// Para content/{locale}/pages/testimonials.json
// locale restrito aos 4 locales suportados
export const TestimonialsSchema = z.array(
  z.object({
    id: z.string().min(1),
    author: z.string().min(1),
    role: z.string().min(1),
    company: z.string().min(1),
    content: z.string().min(1),
    locale: z.enum(['pt-BR', 'it-IT', 'en', 'es-ES']),
  })
)

// ─── 5. HeroSchema ───────────────────────────────────────────────────────────
// Para content/{locale}/pages/hero.json
// Campos mínimos obrigatórios — opcionais marcados com .optional()
export const HeroSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  ctaPrimary: z.string().min(1),
  ctaPrimaryHref: z.string().min(1),
  ctaSecondary: z.string().optional(),
  ctaSecondaryHref: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
})

// ─── 6. AboutSchema ──────────────────────────────────────────────────────────
// Para content/{locale}/pages/about.json
export const AboutSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  avatarUrl: z.string().optional(),
  teamSize: z.number().optional(),
  yearsExperience: z.number().optional(),
})

// ─── 7. AdvisorSchema ────────────────────────────────────────────────────────
// Para content/{locale}/pages/advisor.json
export const AdvisorSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  linkedinUrl: z.string().min(1),
  avatarUrl: z.string().optional(),
  specialties: z.array(z.string()).optional(),
})

// ─── 8. PrivacySchema ────────────────────────────────────────────────────────
// Para content/{locale}/pages/privacy.json
// Estrutura LGPD/GDPR: título + seções com id (ancoragem), heading e parágrafos
export const PrivacySchema = z.object({
  title: z.string().min(1),
  lastUpdated: z.string().min(1),
  sections: z.array(
    z.object({
      id: z.string().optional(),
      heading: z.string().min(1),
      paragraphs: z.array(z.string().min(1)),
    })
  ).min(1),
})

// ─── 9. ContactSchema ────────────────────────────────────────────────────────
// Para content/{locale}/pages/contact.json
export const ContactSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  whatsapp: z.object({
    number: z.string().min(1),
    message: z.string().min(1),
    ctaLabel: z.string().min(1),
  }),
  calendly: z.object({
    url: z.string().min(1),
    ctaLabel: z.string().min(1),
  }),
  email: z.object({
    address: z.string().min(1),
    ctaLabel: z.string().min(1),
  }),
})

// ─── 10. FaqSchema ───────────────────────────────────────────────────────────
// Para content/{locale}/pages/faq.json
export const FaqSchema = z.array(
  z.object({
    id: z.string().min(1),
    question: z.string().min(1),
    answer: z.string().min(1),
  })
)
