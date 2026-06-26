-- migrations/0001_init.sql — Quote Worker (quote-leads D1)
-- Aplicar: wrangler d1 execute quote-leads-<market> --file=migrations/0001_init.sql
-- Compliance: email cru NUNCA armazenado — apenas email_hmac (HMAC-SHA256).
-- Idempotencia por conteudo: UNIQUE(lead_hash, market) + INSERT OR IGNORE.

CREATE TABLE IF NOT EXISTS quote_leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_hash     TEXT NOT NULL,          -- SHA-256(email_hmac:projectType:budgetRange:timeline) - dedup key
  email_hmac    TEXT NOT NULL,          -- HMAC-SHA256(email, AUDIT_PEPPER) - nunca email cru
  name          TEXT NOT NULL,
  whatsapp      TEXT NOT NULL,
  project_type  TEXT NOT NULL CHECK(project_type IN ('web','mobile','ai','other')),
  description   TEXT NOT NULL,
  budget_range  TEXT NOT NULL,
  timeline      TEXT NOT NULL,
  referral_source TEXT,
  locale        TEXT NOT NULL,
  brand         TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','synced')),
  market        TEXT NOT NULL,          -- 'br'|'it'|'en'|'es'
  consent_at    TEXT NOT NULL,          -- ISO 8601
  created_at    TEXT NOT NULL,          -- ISO 8601
  UNIQUE(lead_hash, market)             -- guard idempotencia (INSERT OR IGNORE)
);
CREATE INDEX IF NOT EXISTS idx_quote_leads_market_created ON quote_leads(market, created_at);
