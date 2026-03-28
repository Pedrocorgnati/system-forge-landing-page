-- migrations/0001_init.sql — Worker IT (newsletter-audit D1)
-- Aplicar: wrangler d1 execute newsletter-audit --file=migrations/0001_init.sql
-- Compliance: GDPR Art. 9 — titular pode solicitar dados em 15 dias (query por email_hash)

-- Tabela 1: Audit trail GDPR (append-only)
CREATE TABLE IF NOT EXISTS audit_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash    TEXT NOT NULL,   -- HMAC-SHA256(email, AUDIT_PEPPER) — nunca email bruto
  timestamp_utc TEXT NOT NULL,   -- ISO 8601
  ip_hash       TEXT,            -- SHA-256(ip) — nunca IP bruto (dado pessoal GDPR)
  user_agent    TEXT,
  source_url    TEXT,
  action        TEXT NOT NULL CHECK(action IN ('subscribe','confirm','unsubscribe','suppressed')),
  market        TEXT NOT NULL DEFAULT 'it',
  framework     TEXT NOT NULL DEFAULT 'gdpr'
);
CREATE INDEX IF NOT EXISTS idx_audit_email_market ON audit_events(email_hash, market, timestamp_utc);

-- Tabela 2: Subscriptions (IT começa como pending — double opt-in GDPR)
CREATE TABLE IF NOT EXISTS subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash  TEXT NOT NULL,
  market      TEXT NOT NULL DEFAULT 'it',
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  UNIQUE(email_hash, market)
);
