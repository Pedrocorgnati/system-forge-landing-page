// ---------------------------------------------------------------------------
// email.ts — Templates e envio de email para Worker BR (LGPD)
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";

/** HTML do email de boas-vindas para mercado BR (pt-BR) com CSS inline */
function getWelcomeEmailHTML(domain: string): string {
  const unsubscribeUrl = `https://${domain}/cancelar-inscricao`;

  return `<!DOCTYPE html>
<html lang="pt-BR" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bem-vindo à nossa newsletter!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #1f2937;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
        Bem-vindo à Forja de Sistemas!
      </h1>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        Sua inscrição foi confirmada com sucesso.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        A partir de agora você receberá nossas novidades, dicas e conteúdos exclusivos
        diretamente no seu email. Prometemos enviar apenas conteúdo relevante e de qualidade.
      </p>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
          Obrigado por se inscrever!
        </p>
        <p style="margin: 0; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline; font-size: 12px;">
            Cancelar inscrição
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envia email de boas-vindas para novo assinante BR.
 * Non-blocking: o caller deve usar try/catch e logar erros sem bloquear a resposta.
 */
export async function sendWelcomeEmailBR(
  env: WorkerEnv,
  email: string,
): Promise<void> {
  const domain = env.WORKER_DOMAIN || "newsletter-br.workers.dev";
  const html = getWelcomeEmailHTML(domain);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [email],
      subject: "Bem-vindo à newsletter da Forja de Sistemas!",
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
}
