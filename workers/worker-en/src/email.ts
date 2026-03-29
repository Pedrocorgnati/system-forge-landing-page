// ---------------------------------------------------------------------------
// email.ts — Templates e envio de email para Worker EN (CAN-SPAM)
//
// CAN-SPAM requirements (15 U.S.C. § 7704):
//   - Endereço físico OBRIGATÓRIO no email (Sec. 5(a)(5))
//   - Opt-out link claro e funcional
//   - Identificação como comunicação comercial
//   - Remetente identificável
//
// RFC 8058 — List-Unsubscribe headers (Google/Yahoo 2024 requirement)
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";

/** HTML do email de boas-vindas CAN-SPAM com endereço físico e RFC 8058 */
export function getWelcomeEmailHTML(
  domain: string,
  companyAddress: string,
  unsubscribeUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to our newsletter!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #1f2937;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
        Welcome to SystemForge Software!
      </h1>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        Your subscription has been successfully confirmed.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        From now on you'll receive our latest news, tips, and exclusive content directly in your inbox.
        We promise to send only relevant, quality content.
      </p>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">Thank you for subscribing!</p>
        <p style="margin: 0 0 8px 0; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline; font-size: 12px;">
            Unsubscribe from this newsletter
          </a>
        </p>
        <!-- CAN-SPAM Sec. 5(a)(5): Physical address REQUIRED -->
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          SystemForge Software<br>
          ${companyAddress}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * RFC 8058 headers — obrigatórios para Google/Yahoo deliverability (2024).
 * NÃO usar email em query string — usa token opaco para evitar PII em logs.
 */
export function getRfc8058Headers(
  unsubscribeUrl: string,
  unsubscribeToken: string,
): Record<string, string> {
  const tokenUrl = `${unsubscribeUrl}?token=${unsubscribeToken}`;
  return {
    "List-Unsubscribe": `<mailto:unsubscribe@systemforgesoftware.com?subject=unsubscribe>, <${tokenUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Envia email de boas-vindas CAN-SPAM (non-blocking).
 * Inclui endereço físico e headers RFC 8058.
 */
export async function sendWelcomeEmailEN(
  env: WorkerEnv,
  email: string,
  unsubscribeToken: string,
): Promise<void> {
  const unsubscribeUrl = env.UNSUBSCRIBE_URL || `https://${env.WORKER_DOMAIN}/unsubscribe`;
  const html = getWelcomeEmailHTML(env.WORKER_DOMAIN, env.COMPANY_ADDRESS, unsubscribeUrl);
  const rfc8058Headers = getRfc8058Headers(unsubscribeUrl, unsubscribeToken);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [email],
      subject: "Welcome to SystemForge Software Newsletter!",
      html,
      headers: rfc8058Headers,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend welcome email error (${response.status}): ${errorBody}`);
  }
}
