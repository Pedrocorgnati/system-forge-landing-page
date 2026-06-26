-- migrations/0002_double_optin.sql — Quote Worker (double opt-in, Item 007)
-- Aplicar: wrangler d1 execute quote-leads-<market> --file=migrations/0002_double_optin.sql
-- Adiciona os carimbos de tempo das transicoes de status do double opt-in:
--   pending -> confirmed  (usuario clicou no link /confirm)  -> confirmed_at
--   confirmed -> synced   (lead entregue ao dashboard)        -> synced_at
-- Idempotente: SQLite nao tem "ADD COLUMN IF NOT EXISTS"; rodar uma unica vez
-- por base (a migration 0001 ja garante a tabela). Re-execucao falha com
-- "duplicate column name" — esperado, sinal de ja-aplicada.
-- Compliance inalterada: nenhuma PII crua nova; apenas timestamps ISO 8601.

ALTER TABLE quote_leads ADD COLUMN confirmed_at TEXT;  -- ISO 8601; NULL ate o clique de confirmacao
ALTER TABLE quote_leads ADD COLUMN synced_at TEXT;     -- ISO 8601; NULL ate o sync server-to-server
