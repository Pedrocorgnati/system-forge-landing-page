// ---------------------------------------------------------------------------
// types.ts — Worker BR (newsletter mercado brasileiro)
//
// Nota: scaffold usa StoredSubscription (genérico). Este Worker usa StoredConsent
// (simplificado para mercado único) — sem campo listId pois há 1 lista por Worker.
// Diferença intencional: worker-br/en usam StoredConsent; worker-it usa StoredSubscription.
// ---------------------------------------------------------------------------

export type ComplianceFramework = "lgpd" | "can-spam" | "gdpr";

export interface WorkerEnv {
  NEWSLETTER_KV: KVNamespace;
  D1_AUDIT: D1Database;                 // audit trail LGPD append-only
  RESEND_API_KEY: string;               // secret
  RESEND_AUDIENCE_ID_BR: string;        // secret — audience_id da lista newsletter-br no Resend
  TURNSTILE_SECRET_KEY: string;         // secret — Cloudflare Turnstile server-side verify
  ALLOWED_ORIGINS: string;              // "https://forjadesistemas.com.br,http://localhost:3000"
  WORKER_DOMAIN: string;
  FROM_EMAIL: string;                   // "newsletter@forjadesistemas.com.br"
  SITE_LOCALE: string;                  // "pt-BR"
  AUDIT_PEPPER: string;                 // secret para HMAC-SHA256 do email (não secret acima pois é var)
  TURNSTILE_EXPECTED_HOSTNAME: string;  // "forjadesistemas.com.br"
}

export interface SubscribeRequest {
  email: string;
  consent: boolean;
  source?: string;                      // "footer-form" | "popup" | "hero"
  turnstileToken?: string;             // Cloudflare Turnstile token (recomendado)
}

export type SubscriberStatus = "active" | "unsubscribed" | "suppressed";

export interface StoredConsent {
  email: string;
  locale: string;                       // "pt-BR"
  source: string;
  framework: ComplianceFramework;       // "lgpd"
  status: SubscriberStatus;            // "active" | "unsubscribed" | "suppressed"
  consentedAt: string;                  // ISO 8601 — OBRIGATÓRIO COMP-008
  confirmedAt: string;                  // ISO 8601 — mesmo que consentedAt para LGPD
  unsubscribedAt?: string;              // ISO 8601 — preenchido em opt-out
}

export interface UnsubscribeRequest {
  email: string;
}
