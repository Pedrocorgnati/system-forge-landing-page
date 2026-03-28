-- migrations/0001_init.sql — Worker EN (newsletter-audit D1)
-- Aplicar: wrangler d1 execute newsletter-audit --file=migrations/0001_init.sql
-- Compliance: CAN-SPAM suppression list — reter para demonstrar opt-out processado

-- Tabela 1: Audit trail CAN-SPAM (append-only)
CREATE TABLE IF NOT EXISTS audit_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash    TEXT NOT NULL,
  timestamp_utc TEXT NOT NULL,
  ip_hash       TEXT,
  user_agent    TEXT,
  source_url    TEXT,
  action        TEXT NOT NULL CHECK(action IN ('subscribe','unsubscribe','suppressed')),
  market        TEXT NOT NULL DEFAULT 'en',
  framework     TEXT NOT NULL DEFAULT 'can-spam'
);
CREATE INDEX IF NOT EXISTS idx_audit_email_market ON audit_events(email_hash, market, timestamp_utc);

-- Tabela 2: Subscriptions com UNIQUE constraint (guard G002)
CREATE TABLE IF NOT EXISTS subscriptions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email_hash  TEXT NOT NULL,
  market      TEXT NOT NULL DEFAULT 'en',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TEXT NOT NULL,
  UNIQUE(email_hash, market)
);
