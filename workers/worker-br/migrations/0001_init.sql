-- migrations/0001_init.sql — Worker BR (newsletter-audit D1)
-- Aplicar: wrangler d1 execute newsletter-audit --file=migrations/0001_init.sql
-- Compliance: LGPD Art. 7 e Art. 9 — reter mínimo 5 anos, INSERT-only

-- Tabela 1: Audit trail LGPD (append-only — nunca UPDATE ou DELETE)
CREATE TABLE IF NOT EXISTS audit_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash    TEXT NOT NULL,   -- HMAC-SHA256(email, AUDIT_PEPPER) — nunca email bruto
  timestamp_utc TEXT NOT NULL,   -- ISO 8601
  ip_hash       TEXT,            -- SHA-256(ip) — nunca IP bruto (dado pessoal LGPD)
  user_agent    TEXT,
  source_url    TEXT,
  action        TEXT NOT NULL CHECK(action IN ('subscribe','unsubscribe','suppressed')),
  market        TEXT NOT NULL DEFAULT 'br',
  framework     TEXT NOT NULL DEFAULT 'lgpd'
);
CREATE INDEX IF NOT EXISTS idx_audit_email_market ON audit_events(email_hash, market, timestamp_utc);

-- Tabela 2: Subscriptions com UNIQUE constraint (guard forte G002 — previne TOCTOU do KV)
-- Uso: INSERT OR IGNORE INTO subscriptions(...) VALUES (...)
-- Se changes=0 → email já existe → skip Resend POST
CREATE TABLE IF NOT EXISTS subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash  TEXT NOT NULL,
  market      TEXT NOT NULL DEFAULT 'br',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL,
  UNIQUE(email_hash, market)
);
