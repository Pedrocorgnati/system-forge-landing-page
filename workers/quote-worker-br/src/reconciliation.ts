// ---------------------------------------------------------------------------
// reconciliation.ts — Item 008: kill-switch edge-side + reconciliacao
// observavel Worker<->dashboard.
//
// Dois mecanismos independentes:
//   1. Kill-switch global (`SUBMIT_ENABLED`) — fail-open de disponibilidade.
//   2. Reconciliacao observavel — metrica agregada por janela (default 5m) +
//      alerta por limiar, derivada do D1 do proprio Worker (store persistente;
//      Workers sao stateless entre isolates — licao do Item 004).
//
// Definicao dos contadores (janela [window_start, window_end)):
//   ingeridos   = leads que passaram o double opt-in (confirmed_at na janela) e,
//                 portanto, DEVEM sincronizar ao dashboard. So o cohort
//                 confirmado tenta o sync s2s (Item 007); contar todos os
//                 'pending' nao-confirmados inflaria a divergencia com leads que
//                 nunca deveriam sincronizar (Zero Assumido: regra explicita).
//   verificados = leads efetivamente sincronizados (synced_at na janela). O
//                 status 'synced' so e atingido APOS o ingest retornar 2xx, logo
//                 espelha "registros Quote/User LEAD criados no dashboard".
//   divergencia = ingeridos - verificados (gap de sync s2s do Item 007).
//
// src/ e IDENTICO entre os 4 Workers (quote-worker-{br,it,en,es}).
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";

export const DEFAULT_RECONCILIATION_WINDOW_MIN = 5;
export const DEFAULT_DIVERGENCE_ALERT_THRESHOLD = 3;

/** Parse de inteiro positivo com fallback (vars chegam como string do wrangler.toml). */
export function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt((raw ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Kill-switch fail-open de disponibilidade (Item 008):
 *   - var ausente (undefined)         -> NAO bloqueia (preserva comportamento atual)
 *   - var == "true"                   -> NAO bloqueia
 *   - qualquer outro valor explicito  -> bloqueia (503 SUBMIT_DISABLED)
 *
 * Decisao canonica: a ausencia da var mantem o submit habilitado; o operador
 * flipa `SUBMIT_ENABLED="false"` para desligar o endpoint.
 */
export function killSwitchBlocks(value: string | undefined): boolean {
  return value !== undefined && value !== "true";
}

export type DivergenceLevel = "none" | "warn" | "error" | "unknown";

/**
 * Classifica a divergencia agregada conforme o limiar (Item 008):
 *   "unknown"            -> contagem indisponivel (janela marcada unknown)
 *   divergencia <= 0     -> "none"  (sem alerta; <=0 cobre artefatos de borda)
 *   0 < div < threshold  -> "warn"
 *   divergencia >= thr   -> "error"
 */
export function classifyDivergence(
  divergencia: number | "unknown",
  threshold: number,
): DivergenceLevel {
  if (divergencia === "unknown") return "unknown";
  if (divergencia >= threshold) return "error";
  if (divergencia > 0) return "warn";
  return "none";
}

export interface ReconciliationWindow {
  window: string;
  window_start: string;
  window_end: string;
}

/** Calcula os limites [start, end) da janela de reconciliacao (ISO 8601 UTC). */
export function computeWindow(nowMs: number, windowMin: number): ReconciliationWindow {
  const end = new Date(nowMs);
  const start = new Date(nowMs - windowMin * 60_000);
  return {
    window: `${windowMin}m`,
    window_start: start.toISOString(),
    window_end: end.toISOString(),
  };
}

/** Idempotency-Key correlato (mesmo formato do sync.ts: `quote-{market}-{lead_hash}`). */
export function reconciliationKey(market: string, leadHash: string): string {
  return `quote-${market}-${leadHash}`;
}

async function countLeads(
  env: WorkerEnv,
  column: "confirmed_at" | "synced_at",
  startIso: string,
  endIso: string,
): Promise<number> {
  // `column` e um literal de tipo fechado (nunca user-input) — sem risco de SQLi.
  const row = await env.D1_LEADS.prepare(
    `SELECT COUNT(*) AS n FROM quote_leads WHERE market = ? AND ${column} >= ? AND ${column} < ?`,
  )
    .bind(env.MARKET, startIso, endIso)
    .first<{ n: number }>();
  return row ? Number(row.n) : 0;
}

/**
 * Emite a metrica agregada `lead_reconciliation` da janela e o alerta por limiar.
 * Non-blocking: NUNCA lanca. Leitura indisponivel -> `reconciliation_error` +
 * janela `unknown` (NUNCA divergencia falsa `0`).
 *
 * Observavel via `wrangler tail` / Cloudflare Logs.
 */
export async function reconcileWindow(env: WorkerEnv, nowMs: number = Date.now()): Promise<void> {
  const windowMin = parsePositiveInt(env.RECONCILIATION_WINDOW_MIN, DEFAULT_RECONCILIATION_WINDOW_MIN);
  const threshold = parsePositiveInt(env.DIVERGENCE_ALERT_THRESHOLD, DEFAULT_DIVERGENCE_ALERT_THRESHOLD);
  const { window, window_start, window_end } = computeWindow(nowMs, windowMin);

  let ingeridos: number | "unknown";
  try {
    ingeridos = await countLeads(env, "confirmed_at", window_start, window_end);
  } catch (err) {
    console.error({ code: "reconciliation_error", source: "ingeridos", market: env.MARKET, window: "unknown", err: String(err) });
    ingeridos = "unknown";
  }

  let verificados: number | "unknown";
  try {
    verificados = await countLeads(env, "synced_at", window_start, window_end);
  } catch (err) {
    console.error({ code: "reconciliation_error", source: "verificados", market: env.MARKET, window: "unknown", err: String(err) });
    verificados = "unknown";
  }

  if (ingeridos === "unknown" || verificados === "unknown") {
    // Janela marcada unknown: NUNCA emitir divergencia falsa `0`.
    console.log({ metric: "lead_reconciliation", ingeridos, verificados, divergencia: "unknown", window, window_start, window_end });
    return;
  }

  const divergencia = ingeridos - verificados;
  console.log({ metric: "lead_reconciliation", ingeridos, verificados, divergencia, window, window_start, window_end });

  const level = classifyDivergence(divergencia, threshold);
  if (level === "error") {
    console.error({ code: "RECONCILIATION_DIVERGENCE", level: "error", scope: "aggregate", market: env.MARKET, ingeridos, verificados, divergencia, threshold, window, window_start, window_end });
  } else if (level === "warn") {
    console.warn({ code: "RECONCILIATION_DIVERGENCE", level: "warn", scope: "aggregate", market: env.MARKET, ingeridos, verificados, divergencia, threshold, window, window_start, window_end });
  }
}
