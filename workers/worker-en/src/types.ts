// ---------------------------------------------------------------------------
// types.ts — Worker EN (newsletter mercado inglês — CAN-SPAM)
//
// Nota: scaffold usa StoredSubscription (genérico). Este Worker usa StoredConsent
// (simplificado para mercado único) — sem campo listId pois há 1 lista por Worker.
// Diferença intencional: worker-br/en usam StoredConsent; worker-it usa StoredSubscription.
// ---------------------------------------------------------------------------

export type ComplianceFramework = "lgpd" | "can-spam" | "gdpr";
export type SubscriberStatus = "active" | "unsubscribed" | "suppressed";

export interface WorkerEnv {
  NEWSLETTER_KV: KVNamespace;
  D1_AUDIT: D1Database;                  // audit trail CAN-SPAM append-only
  RESEND_API_KEY: string;                // secret
  RESEND_AUDIENCE_ID_EN: string;         // secret — audience_id da lista newsletter-en no Resend
  TURNSTILE_SECRET_KEY: string;          // secret — Cloudflare Turnstile server-side verify
  ALLOWED_ORIGINS: string;               // "https://systemforgesoftware.com,http://localhost:3000"
  WORKER_DOMAIN: string;
  FROM_EMAIL: string;                    // "newsletter@systemforgesoftware.com"
  SITE_LOCALE: string;                   // "en"
  AUDIT_PEPPER: string;                  // pepper para HMAC-SHA256
  TURNSTILE_EXPECTED_HOSTNAME: string;   // "systemforgesoftware.com"
  // ⚠️ RELEASE BLOCKER — CAN-SPAM Sec. 5(a)(5): endereço físico obrigatório
  COMPANY_ADDRESS: string;
  UNSUBSCRIBE_URL: string;               // URL para List-Unsubscribe header (RFC 8058)
}

export interface SubscribeRequest {
  email: string;
  consent?: boolean;                     // Opcional para CAN-SPAM
  source?: string;
  turnstileToken?: string;
}

export interface StoredConsent {
  email: string;
  locale: string;                        // "en"
  source: string;
  framework: "can-spam";
  status: SubscriberStatus;
  consentedAt: string;
  confirmedAt: string;
  unsubscribedAt?: string;
}

export interface UnsubscribeRequest {
  email: string;
}
