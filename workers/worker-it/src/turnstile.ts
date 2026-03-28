// ---------------------------------------------------------------------------
// turnstile.ts — Cloudflare Turnstile server-side verification (G006)
// Padrão reutilizado pelos 3 Workers (cópias independentes por design).
// ---------------------------------------------------------------------------

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

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
      { method: "POST", body },
    );
    const data = (await res.json()) as TurnstileResponse;
    return data.success && data.hostname === expectedHostname;
  } catch {
    return false;
  }
}
