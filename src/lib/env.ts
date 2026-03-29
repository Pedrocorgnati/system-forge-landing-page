import { z } from 'zod'

/**
 * Schema de validação de variáveis de ambiente.
 * Campos obrigatórios lançam erro fatal na inicialização.
 * Campos opcionais têm default ou são undefined.
 *
 * Erros de ENV:
 *   ENV_001: SITE_URL ausente ou inválido — fatal
 *   ENV_002: WHATSAPP_NUMBER ausente — CTAs WhatsApp desabilitados
 *   ENV_003: CALENDLY_URL ausente — CTAs Calendly desabilitados
 *   ENV_004: URL de CTA com domínio não permitido — bloqueado por segurança
 */
const EnvSchema = z.object({
  // ===== OBRIGATÓRIOS =====
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('ENV_001: SITE_URL deve ser uma URL válida (ex: https://forjadesistemas.com.br)')
    .min(1, 'ENV_001: NEXT_PUBLIC_SITE_URL é obrigatório'),

  // ===== CTAs de Conversão =====
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .min(1, 'ENV_002: WHATSAPP_NUMBER é obrigatório para CTAs de WhatsApp')
    .regex(/^\+[1-9]\d{1,14}$/, 'Formato: +5548999999999'),

  // ENV_003: Calendly removido — CTAs Calendly desativados em todos os locales.
  // Campo preservado como opcional para builds legados que ainda passam a env var.
  NEXT_PUBLIC_CALENDLY_URL: z
    .string()
    .optional(),

  NEXT_PUBLIC_BUDGET_ENGINE_URL: z
    .string()
    .url('BUDGET_ENGINE_URL deve ser uma URL válida'),

  // ===== Analytics (Opcionais mas recomendados) =====
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, 'Formato: G-XXXXXXXXXX')
    .optional(),

  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z
    .string()
    .optional(),

  // ===== Cloudflare (Opcional) =====
  NEXT_PUBLIC_CLOUDFLARE_ZONE_ID: z
    .string()
    .optional(),

  // NOTA: RESEND_API_KEY é secret do Cloudflare Worker (wrangler secret put),
  // NÃO pertence ao schema do Next.js — configurar apenas no Worker.
  // Newsletter worker URLs são lidas diretamente via config/sites/{br,it,en}.ts
  // (NEXT_PUBLIC_NEWSLETTER_WORKER_URL_{BR,IT,EN})

  // ===== i18n Quad-Market =====
  // Obrigatório nos scripts build:br / build:it / build:en / build:es
  // Opcional em dev e no script build genérico (fallback: 'pt-BR' via getActiveLocale)
  NEXT_PUBLIC_LOCALE: z
    .enum(['pt-BR', 'it-IT', 'en', 'es-ES'] as const, {
      errorMap: () => ({ message: 'NEXT_PUBLIC_LOCALE deve ser um de: pt-BR, it-IT, en, es-ES' }),
    })
    .optional(),

  // Obrigatório nos scripts build:br / build:it / build:en
  // Ausente em dev → next.config.ts usa '.next' como fallback
  OUT_DIR: z.string().min(1, 'OUT_DIR não pode ser vazio').optional(),
})

export type Env = z.infer<typeof EnvSchema>

/**
 * Valida e retorna as variáveis de ambiente.
 * Lança ZodError com mensagem descritiva se SITE_URL ausente.
 * Chame apenas no servidor (layout.tsx, page.tsx no Next.js App Router).
 */
export function getValidatedEnv(): Env {
  const result = EnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL,
    NEXT_PUBLIC_BUDGET_ENGINE_URL: process.env.NEXT_PUBLIC_BUDGET_ENGINE_URL,
    NEXT_PUBLIC_GA4_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    NEXT_PUBLIC_CLOUDFLARE_ZONE_ID: process.env.NEXT_PUBLIC_CLOUDFLARE_ZONE_ID,
    NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE,
    OUT_DIR: process.env.OUT_DIR,
  })

  if (!result.success) {
    const errors = result.error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`)
    throw new Error(
      `[SystemForge] Variáveis de ambiente inválidas:\n${errors.join('\n')}\n\nVerifique seu .env.local (veja .env.example)`
    )
  }

  return result.data
}

/**
 * Allowlist de domínios permitidos para CTAs externos.
 * Defesa contra THREAT-MODEL T-009 (open redirect).
 */
export const ALLOWED_CTA_DOMAINS = [
  'wa.me',
  'api.whatsapp.com',
  'calendly.com',
  'cal.com',
  'budgetengine.app',
] as const

// isAllowedCTAHref removido — função centralizada em src/lib/cta.ts (TASK-5)

// Singleton — use em módulos server-side
// Para client components, acesse process.env.NEXT_PUBLIC_* diretamente
// NOTA: O singleton só é instanciado em runtime (não durante tsc --noEmit)
let _env: Env | null = null

export function getEnv(): Env {
  if (!_env) {
    _env = getValidatedEnv()
  }
  return _env
}
