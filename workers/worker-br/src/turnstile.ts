// ---------------------------------------------------------------------------
// turnstile.ts — Cloudflare Turnstile server-side verification (G006)
// Padrão reutilizado pelos 3 Workers (cópias independentes por design).
// ---------------------------------------------------------------------------

interface TurnstileResponse {
  success: boolean;
  hostname?: string;       // validar contra domínio esperado — evita token de outro domínio
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verifica token Turnstile via API Cloudflare.
 * Valida também o hostname para evitar que tokens de outros domínios sejam aceitos.
 *
 * @param token - Token do cliente (cf-turnstile-response)
 * @param secretKey - Secret configurado no Cloudflare Turnstile
 * @param expectedHostname - Domínio esperado (ex: "forjadesistemas.com.br")
 * @param ip - IP do cliente (opcional, aumenta precisão)
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
    // Validar hostname — sem isso, token de outro domínio seria aceito
    return data.success && data.hostname === expectedHostname;
  } catch {
    return false;
  }
}
