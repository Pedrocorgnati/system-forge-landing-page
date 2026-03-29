// ---------------------------------------------------------------------------
// types.ts — Worker ES (newsletter mercado español — GDPR double opt-in)
//
// España es miembro de la UE → RGPD obligatorio (equivalente al GDPR italiano).
// Este Worker usa StoredSubscription con estado pending|active igual que worker-it.
// ---------------------------------------------------------------------------

export type ComplianceFramework = "lgpd" | "can-spam" | "gdpr";
export type SubscriberStatus = "pending" | "active" | "unsubscribed" | "suppressed";

export interface WorkerEnv {
  NEWSLETTER_KV: KVNamespace;
  D1_AUDIT: D1Database;                 // audit trail GDPR append-only
  RESEND_API_KEY: string;               // secret
  RESEND_AUDIENCE_ID_ES: string;        // secret — audience_id da lista newsletter-es no Resend
  TURNSTILE_SECRET_KEY: string;         // secret — Cloudflare Turnstile server-side verify
  ALLOWED_ORIGINS: string;              // "https://systemforge.es,http://localhost:3000"
  WORKER_DOMAIN: string;
  FROM_EMAIL: string;                   // "newsletter@systemforge.es"
  SITE_LOCALE: string;                  // "es-ES"
  AUDIT_PEPPER: string;                 // pepper para HMAC-SHA256 do email
  TURNSTILE_EXPECTED_HOSTNAME: string;  // "systemforge.es"
}

export interface SubscribeRequest {
  email: string;
  consent: boolean;
  locale?: string;                      // "es-ES" (opcional — Worker já sabe)
  source?: string;
  turnstileToken?: string;
}

/** StoredSubscription — compatível com scaffold, estado pending|active para GDPR */
export interface StoredSubscription {
  email: string;
  locale: string;                       // "es-ES"
  listId: string;                       // "newsletter-es"
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
