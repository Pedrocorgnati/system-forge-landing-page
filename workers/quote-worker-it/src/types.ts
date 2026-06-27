// ---------------------------------------------------------------------------
// types.ts — Quote Worker (leads de orcamento por locale)
//
// Estrutura clonada de workers/worker-br (newsletter) e adaptada para o
// payload do quote-wizard. src/ e IDENTICO entre os 4 Workers
// (quote-worker-{br,it,en,es}); a diferenciacao por locale vive em
// wrangler.toml (SITE_LOCALE / MARKET / ALLOWED_ORIGINS / hostname).
// ---------------------------------------------------------------------------

export type ProjectType = "web" | "mobile" | "ai" | "other";

// Binding nativo de Rate Limiting do Cloudflare ([[ratelimit]] no wrangler.toml).
// Tipo minimo local (os @cloudflare/workers-types emprestados do base ainda nao
// expoem RateLimit de forma estavel). success=false quando a chave estourou o
// limite no periodo configurado.
export interface RateLimit {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface WorkerEnv {
  D1_LEADS: D1Database;                 // base de leads de orcamento (quote_leads)
  ALLOWED_ORIGINS: string;              // "https://forjadesistemas.com.br,http://localhost:3000"
  SITE_LOCALE: string;                  // "pt-BR" | "it-IT" | "en" | "es-ES"
  MARKET: string;                       // "br" | "it" | "en" | "es"
  AUDIT_PEPPER: string;                 // var — HMAC-SHA256 do email (rotacionar no deploy, Item 018)
  TURNSTILE_EXPECTED_HOSTNAME: string;  // hostname esperado do token Turnstile
  WORKER_DOMAIN: string;                // var — dominio publico do Worker; base do link /confirm (Item 007/019)
  // Binding [[ratelimit]] (Item 006 — rate-limit por IP, fail-open). Opcional:
  // ausencia/erro cai em fail-open (degradado), nunca em 500.
  RATE_LIMITER?: RateLimit;
  // Secret do Item 006 — agora OBRIGATORIO em runtime (Turnstile fail-closed):
  TURNSTILE_SECRET_KEY?: string;        // secret (Item 006 — fail-closed, enforced)
  // Item 007 — double opt-in + sync server-to-server:
  RESEND_API_KEY?: string;              // secret — envio do email de confirmacao via Resend
  FROM_EMAIL: string;                   // var — remetente Resend verificado (local-part por idioma)
  CONFIRM_TOKEN_SECRET?: string;        // secret — assinatura HMAC do token de confirmacao (separado de AUDIT_PEPPER)
  QUOTE_INGEST_URL: string;             // var — URL do ingest do dashboard
  QUOTE_INGEST_SECRET?: string;         // secret — == INTERNAL_INGEST_TOKEN do dashboard (X-Internal-Token)
  INGEST_ORIGIN: string;                // var — enum Origin do dashboard (SYSTEMFORGE_BR|_IT|_EN|_ES)
  CONFIRM_TOKEN_TTL_HOURS: string;      // var — TTL do token em horas (fallback 48 quando ausente/invalido)
  // Item 008 — kill-switch edge-side + reconciliacao observavel:
  SUBMIT_ENABLED?: string;              // var — kill-switch global; fail-open (ausente OU "true" habilita; outro valor -> 503 SUBMIT_DISABLED)
  DIVERGENCE_ALERT_THRESHOLD?: string;  // var — limiar do alerta agregado de divergencia (fallback 3)
  RECONCILIATION_WINDOW_MIN?: string;   // var — janela de reconciliacao em minutos (fallback 5)
}

// Payload recebido em POST /lead (contrato campo a campo da Task 005).
export interface LeadRequest {
  serviceId: string;        // um dos 9 ids de SERVICE_ID_TO_TYPE — id cru NUNCA persiste
  description: string;      // 20..2000 chars apos fold
  budgetRange: string;      // enum: under1k|1k-5k|5k-15k|15k-50k|50k-plus|not-sure (+legacy under5k)
  timeline: string;         // enum fechado: asap|1-3months|3-6months|6-plus|flexible (identico ao dashboard, task-008 G-P2-10)
  name: string;             // >= 2 chars
  email: string;            // regex; persistido SOMENTE como HMAC-SHA256
  whatsapp: string;         // 8..20 chars, regex /^[+\d][\d\s().-]{6,19}$/ (identico ao dashboard, task-008 G-P2-10)
  referralSource?: string;  // opcional (nullable no D1)
  consent: boolean;         // === true senao CONSENT_REQUIRED
  turnstileToken?: string;  // best-effort em 005; obrigatorio no Item 006
  website?: string;         // honeypot — aceito; rejeicao quando preenchido e do Item 006
  locale: string;           // == SITE_LOCALE do Worker
  brand?: string;           // identificador livre da marca/origem, <= 64 chars [a-z0-9-]
}

// Linha persistida em quote_leads (espelha a migration 0001_init.sql).
export interface StoredLead {
  lead_hash: string;        // SHA-256(email_hmac:projectType:budgetRange:timeline) — dedup
  email_hmac: string;       // HMAC-SHA256(email, AUDIT_PEPPER) — nunca email cru
  name: string;
  whatsapp: string;
  project_type: ProjectType;
  description: string;
  budget_range: string;
  timeline: string;
  referral_source: string | null;
  locale: string;
  brand: string | null;
  status: "pending" | "confirmed" | "synced";
  market: string;
  consent_at: string;       // ISO 8601
  created_at: string;       // ISO 8601
}
