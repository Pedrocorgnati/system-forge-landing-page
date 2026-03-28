// ---------------------------------------------------------------------------
// types.ts — Worker IT (newsletter mercado italiano — GDPR double opt-in)
//
// Nota: scaffold usa StoredSubscription (genérico, inclui listId e status pending|active).
// Este Worker usa StoredSubscription (conforme scaffold) pois IT precisa do
// estado "pending" para o double opt-in GDPR — diverge do worker-br/en que usam StoredConsent.
// ---------------------------------------------------------------------------

export type ComplianceFramework = "lgpd" | "can-spam" | "gdpr";
export type SubscriberStatus = "pending" | "active" | "unsubscribed" | "suppressed";

export interface WorkerEnv {
  NEWSLETTER_KV: KVNamespace;
  D1_AUDIT: D1Database;                 // audit trail GDPR append-only
  RESEND_API_KEY: string;               // secret
  RESEND_AUDIENCE_ID_IT: string;        // secret — audience_id da lista newsletter-it no Resend
  TURNSTILE_SECRET_KEY: string;         // secret — Cloudflare Turnstile server-side verify
  ALLOWED_ORIGINS: string;              // "https://systemforge.it,http://localhost:3000"
  WORKER_DOMAIN: string;
  FROM_EMAIL: string;                   // "newsletter@systemforge.it"
  SITE_LOCALE: string;                  // "it-IT"
  AUDIT_PEPPER: string;                 // pepper para HMAC-SHA256 do email
  TURNSTILE_EXPECTED_HOSTNAME: string;  // "systemforge.it"
}

export interface SubscribeRequest {
  email: string;
  consent: boolean;
  locale?: string;                      // "it-IT" (opcional — Worker já sabe)
  source?: string;
  turnstileToken?: string;
}

/** StoredSubscription — compatível com scaffold, estado pending|active para GDPR */
export interface StoredSubscription {
  email: string;
  locale: string;                       // "it-IT"
  listId: string;                       // "newsletter-it"
  framework: ComplianceFramework;       // "gdpr"
  status: SubscriberStatus;            // "pending" → "active"
  createdAt: string;                    // ISO 8601
  confirmedAt?: string;                 // ISO 8601 — preenchido ao confirmar
  source?: string;
  unsubscribedAt?: string;
}

export interface UnsubscribeRequest {
  email: string;
}
