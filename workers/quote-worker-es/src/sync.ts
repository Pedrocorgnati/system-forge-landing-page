// ---------------------------------------------------------------------------
// sync.ts — Sync server-to-server Worker -> dashboard (Item 007)
//
// Apos a confirmacao (GET /confirm), o Worker envia a PII crua (carregada do
// token de confirmacao) para POST {dashboard}/api/internal/quote-ingest com
// X-Internal-Token + Idempotency-Key. A autoridade de dedup e o dashboard:
// Idempotency-Key estavel por lead -> reenvio nunca duplica.
//
// src/ e IDENTICO entre os 4 Workers.
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";
import type { ConfirmTokenPayload } from "./confirm-token";

/**
 * Monta o body canonico EXATO do schema Zod do dashboard
 * (internalQuoteIngestSchema). `referralSource` e omitido quando null para
 * casar com `.optional()`.
 */
export function buildIngestBody(p: ConfirmTokenPayload): Record<string, unknown> {
  const body: Record<string, unknown> = {
    origin: p.origin,
    language: p.language,
    name: p.name,
    email: p.email,
    whatsapp: p.whatsapp,
    projectType: p.projectType,
    description: p.description,
    budgetRange: p.budgetRange,
    timeline: p.timeline,
    features: p.features,
  };
  if (p.referralSource !== null && p.referralSource !== undefined) {
    body.referralSource = p.referralSource;
  }
  return body;
}

export interface SyncResult {
  ok: boolean;
  status: number;
  duplicate: boolean;
}

/**
 * Sincroniza o lead confirmado ao dashboard. Idempotency-Key estavel por lead,
 * namespaced por market para nunca colidir globalmente.
 *
 * Mapeamento de status:
 *   201 -> { ok:true,  duplicate:false }  (criado)
 *   200 -> { ok:true,  duplicate:true  }  (replay idempotente)
 *   409 -> { ok:true,  duplicate:true  }  (ja-recebido reconciliavel; log)
 *   demais (401/4xx/5xx) -> { ok:false, duplicate:false }
 *
 * Pre-flight fail-closed: sem secret ou sem URL -> nao chama a rede.
 */
export async function syncToDashboard(
  env: WorkerEnv,
  payload: ConfirmTokenPayload,
): Promise<SyncResult> {
  if (!env.QUOTE_INGEST_SECRET || !env.QUOTE_INGEST_URL) {
    console.error({ code: "INGEST_CONFIG_ERROR", market: env.MARKET });
    return { ok: false, status: 0, duplicate: false };
  }

  const idempotencyKey = `quote-${payload.market}-${payload.lead_hash}`;

  let response: Response;
  try {
    response = await fetch(env.QUOTE_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": env.QUOTE_INGEST_SECRET,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(buildIngestBody(payload)),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error({ code: "INGEST_NETWORK_ERROR", market: env.MARKET, err: String(err) });
    return { ok: false, status: 0, duplicate: false };
  }

  if (response.status === 201) {
    return { ok: true, status: 201, duplicate: false };
  }
  if (response.status === 200) {
    return { ok: true, status: 200, duplicate: true };
  }
  if (response.status === 409) {
    // Mesma key, payload divergente — nao deve ocorrer para o mesmo lead.
    // Reconciliavel: logar para auditoria (sem PII) e tratar como ja-recebido.
    console.error({ code: "INGEST_CONFLICT", market: env.MARKET, lead_hash: payload.lead_hash });
    return { ok: true, status: 409, duplicate: true };
  }

  console.error({ code: "INGEST_FAILED", market: env.MARKET, upstream: response.status });
  return { ok: false, status: response.status, duplicate: false };
}
