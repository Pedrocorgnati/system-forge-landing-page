-- migrations/0003_reconciliation_indexes.sql — Quote Worker (Item 008)
-- Aplicar: wrangler d1 execute quote-leads-<market> --file=migrations/0003_reconciliation_indexes.sql
-- Indices de suporte a reconciliacao observavel Worker<->dashboard:
--   ingeridos   = COUNT(*) WHERE confirmed_at em [window_start, window_end)
--   verificados = COUNT(*) WHERE synced_at    em [window_start, window_end)
-- Idempotente: CREATE INDEX IF NOT EXISTS (re-execucao e no-op).
-- Compliance inalterada: indices sobre timestamps ISO 8601, nenhuma PII nova.

CREATE INDEX IF NOT EXISTS idx_quote_leads_market_confirmed ON quote_leads(market, confirmed_at);
CREATE INDEX IF NOT EXISTS idx_quote_leads_market_synced ON quote_leads(market, synced_at);
