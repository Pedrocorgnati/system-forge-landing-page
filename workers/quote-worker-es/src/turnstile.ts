// ---------------------------------------------------------------------------
// turnstile.ts — Cloudflare Turnstile server-side verification (G006)
// Herdado de workers/worker-br. Em 005 e usado em modo best-effort (so roda
// quando turnstileToken esta presente E o secret esta configurado); o
// enforcement fail-closed (token obrigatorio) e do Item 006.
// ---------------------------------------------------------------------------

interface TurnstileResponse {
  success: boolean;
  hostname?: string;       // validar contra dominio esperado — evita token de outro dominio
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verifica token Turnstile via API Cloudflare.
 * Valida tambem o hostname para evitar que tokens de outros dominios sejam aceitos.
 */
export async function verifyTurnstile(
  token: string,
  secretKey: string,
  expectedHostname: string,
  ip?: string,
): Promise<boolean> {
  const body = new FormData();
  body.append("secret", secretKey);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, signal: AbortSignal.timeout(5_000) },
    );
    const data = (await res.json()) as TurnstileResponse;
    return data.success && data.hostname === expectedHostname;
  } catch {
    return false;
  }
}
