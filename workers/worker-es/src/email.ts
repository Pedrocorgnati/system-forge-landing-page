// ---------------------------------------------------------------------------
// email.ts — Templates e envio de email para Worker ES (GDPR/RGPD)
// España es miembro de la UE → RGPD obligatorio (doble opt-in)
// ---------------------------------------------------------------------------

import type { WorkerEnv } from "./types";

/** HTML del email de confirmación RGPD (es-ES) */
function getConfirmationEmailHTML(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es-ES" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirma tu suscripción</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #1f2937;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
        Confirma tu suscripción
      </h1>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        ¡Gracias por tu interés en nuestra newsletter!
        Para completar la suscripción, haz clic en el botón de abajo.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${confirmUrl}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px;"
           target="_blank">
          Confirmar suscripción
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #6b7280; margin: 0 0 16px 0;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${confirmUrl}" style="color: #2563eb; text-decoration: underline; font-size: 13px; word-break: break-all;">
          ${confirmUrl}
        </a>
      </p>
      <p style="font-size: 13px; color: #9ca3af; margin: 0 0 20px 0;">
        El enlace caduca en 24 horas. Si no solicitaste esta suscripción, puedes ignorar este correo.
      </p>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Recibiste este correo porque alguien introdujo tu dirección en nuestro formulario.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** HTML da página de confirmação inline (retornado pelo GET /confirm) */
export function getConfirmationPage(locale: string): string {
  const isES = locale.startsWith("es");
  const title = isES ? "Suscripción Confirmada" : "Subscription Confirmed";
  const body = isES
    ? "¡Gracias! Tu suscripción a la newsletter ha sido confirmada."
    : "Thank you! Your newsletter subscription has been confirmed.";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f9fafb; color: #1f2937; }
    .card { text-align: center; padding: 3rem 2rem; background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px rgba(0,0,0,0.07); max-width: 480px; }
    .check { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check" aria-hidden="true">&#10003;</div>
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

/** HTML del email de bienvenida (es-ES) — enviado após confirmação */
function getWelcomeEmailHTML(domain: string): string {
  const unsubscribeUrl = `https://${domain}/unsubscribe`;

  return `<!DOCTYPE html>
<html lang="es-ES" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>¡Bienvenido a nuestra newsletter!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #1f2937;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
        ¡Bienvenido a nuestra newsletter!
      </h1>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        Tu suscripción ha sido confirmada con éxito.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 20px 0;">
        A partir de ahora recibirás nuestras novedades, consejos y contenidos exclusivos
        directamente en tu bandeja de entrada.
      </p>
      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">¡Gracias por suscribirte!</p>
        <p style="margin: 0; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #2563eb; text-decoration: underline; font-size: 12px;">
            Cancelar suscripción
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envía email de confirmación RGPD (bloqueante — fallo debe propagarse).
 * Si falla, el caller debe eliminar el pending token del KV y retornar 500.
 */
export async function sendConfirmationEmail(
  env: WorkerEnv,
  email: string,
  token: string,
): Promise<void> {
  const domain = env.WORKER_DOMAIN || "newsletter-es.workers.dev";
  const confirmUrl = `https://${domain}/confirm?token=${token}`;
  const html = getConfirmationEmailHTML(confirmUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [email],
      subject: "Confirma tu suscripción a la newsletter",
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend confirmation email error (${response.status}): ${errorBody}`);
  }
}

/**
 * Envía email de bienvenida RGPD (non-blocking — errores solo logueados).
 */
export async function sendWelcomeEmailES(
  env: WorkerEnv,
  email: string,
): Promise<void> {
  const domain = env.WORKER_DOMAIN || "newsletter-es.workers.dev";
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
      subject: "¡Bienvenido a la newsletter de SystemForge!",
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend welcome email error (${response.status}): ${errorBody}`);
  }
}
