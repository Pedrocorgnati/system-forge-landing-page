/**
 * Cloudflare Worker — Newsletter Proxy para Resend API
 *
 * Protege a RESEND_API_KEY de ser exposta ao cliente.
 * Implementa: CORS, rate limiting (KV), honeypot, double opt-in.
 *
 * Deploy: npx wrangler deploy
 * Secrets: npx wrangler secret put RESEND_API_KEY
 *          npx wrangler secret put RESEND_AUDIENCE_ID
 *
 * THREAT-MODEL T-003: API key nunca exposta ao browser.
 */

interface Env {
  RESEND_API_KEY: string
  RESEND_AUDIENCE_ID: string
  RATE_LIMIT_KV: KVNamespace
  ALLOWED_ORIGIN: string
}

interface RequestBody {
  email: string
  consent: boolean
  website?: string // honeypot
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env.ALLOWED_ORIGIN) })
    }

    const url = new URL(request.url)
    const workerOrigin = url.origin

    if (url.pathname === '/confirm') {
      return handleConfirmation(env, url)
    }

    if (url.pathname === '/unsubscribe') {
      return handleUnsubscribe(env, url)
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // Verificar CORS
    const origin = request.headers.get('Origin') ?? ''
    const isAllowed =
      origin === env.ALLOWED_ORIGIN ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')

    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 })
    }

    const cors = corsHeaders(origin)

    // Rate limiting por IP — max 3 req/IP/hora via KV
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    const rateLimitKey = `rate:${ip}`
    const currentCount = parseInt((await env.RATE_LIMIT_KV.get(rateLimitKey)) ?? '0', 10)

    if (currentCount >= 3) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...cors } },
      )
    }

    // Parse do body
    let body: RequestBody
    try {
      body = await request.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Body inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...cors } },
      )
    }

    const { email, consent, website } = body

    // Honeypot — retornar 200 silencioso (bot acredita que funcionou)
    if (website && website.trim() !== '') {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...cors } },
      )
    }

    // Validação de email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...cors } },
      )
    }

    // Validação de consentimento LGPD
    if (!consent) {
      return new Response(
        JSON.stringify({ error: 'Consentimento LGPD obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...cors } },
      )
    }

    // Incrementar rate limit (expira em 3600s = 1 hora)
    ctx.waitUntil(
      env.RATE_LIMIT_KV.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 3600 }),
    )

    // Gerar token de confirmação UUID v4 (criptograficamente seguro)
    const token = crypto.randomUUID()
    // Link no email aponta para o WORKER /confirm — o Worker valida e redireciona ao Next.js
    const confirmUrl = `${workerOrigin}/confirm?token=${token}`

    // Armazenar token no KV (expira em 48h = 172800s)
    await env.RATE_LIMIT_KV.put(`token:${token}`, email, { expirationTtl: 172800 })

    // Enviar NOTIF-001 via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SystemForge <nao-responda@forjadesistemas.com.br>',
        to: [email],
        subject: 'Confirme sua inscrição na newsletter SystemForge',
        html: confirmationEmailHtml(email, confirmUrl),
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('Resend API error (NOTIF-001):', errorData)
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar email de confirmação. Tente novamente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...cors } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email de confirmação enviado!' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors },
      },
    )
  },
}

// =====================================================================
// Endpoint GET /confirm?token={uuid} — Double Opt-in
// =====================================================================
async function handleConfirmation(env: Env, url: URL): Promise<Response> {
  const workerOrigin = url.origin
  const token = url.searchParams.get('token')

  if (!token) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}/newsletter/confirmado?error=token_missing`, 302)
  }

  const email = await env.RATE_LIMIT_KV.get(`token:${token}`)

  if (!email) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}/newsletter/confirmado?error=token_invalid`, 302)
  }

  // Ativar contato na Resend audience
  const createContactResponse = await fetch(
    `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    },
  )

  if (!createContactResponse.ok) {
    return Response.redirect(
      `${env.ALLOWED_ORIGIN}/newsletter/confirmado?error=activation_failed`,
      302,
    )
  }

  // Deletar token de confirmação (uso único — não pode ser confirmado duas vezes)
  await env.RATE_LIMIT_KV.delete(`token:${token}`)

  // Gerar token de unsubscribe personalizado (TTL 1 ano)
  // Link aponta para o WORKER /unsubscribe — não para o Next.js
  const unsubToken = crypto.randomUUID()
  const unsubUrl = `${workerOrigin}/unsubscribe?token=${unsubToken}`
  await env.RATE_LIMIT_KV.put(`unsub:${unsubToken}`, email, {
    expirationTtl: 60 * 60 * 24 * 365,
  })

  // Enviar NOTIF-002 (boas-vindas)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SystemForge <nao-responda@forjadesistemas.com.br>',
      to: [email],
      subject: 'Bem-vindo(a) à newsletter SystemForge!',
      html: welcomeEmailHtml(unsubUrl),
    }),
  })

  return Response.redirect(`${env.ALLOWED_ORIGIN}/newsletter/confirmado?success=true`, 302)
}

// =====================================================================
// Endpoint GET /unsubscribe?token={uuid} — Cancelamento LGPD
// =====================================================================
async function handleUnsubscribe(env: Env, url: URL): Promise<Response> {
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response('Token inválido', { status: 400 })
  }

  const email = await env.RATE_LIMIT_KV.get(`unsub:${token}`)

  if (!email) {
    return new Response('Link de cancelamento inválido ou expirado', { status: 400 })
  }

  // Remover contact da Resend audience
  await fetch(
    `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts/${email}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
    },
  )

  // Enviar NOTIF-003 (cancelamento)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SystemForge <nao-responda@forjadesistemas.com.br>',
      to: [email],
      subject: 'Sua inscrição foi cancelada — SystemForge',
      html: cancellationEmailHtml(),
    }),
  })

  // Deletar token de unsubscribe
  await env.RATE_LIMIT_KV.delete(`unsub:${token}`)

  return new Response('Inscrição cancelada com sucesso.', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// =====================================================================
// NOTIF-001: Template HTML — Email de Confirmação (Double Opt-in)
// =====================================================================
function confirmationEmailHtml(_email: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirme sua inscrição</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:48px;max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:24px;font-weight:700;color:#2563EB;letter-spacing:-0.5px;">SystemForge</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">Engenharia de Software sob Medida</div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">Confirme sua inscrição</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Obrigado por se inscrever na newsletter da SystemForge!</p>
              <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">Clique no botão abaixo para confirmar seu email e começar a receber artigos sobre engenharia de software, tendências e casos de uso reais.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${confirmUrl}"
                 style="display:inline-block;background-color:#2563EB;color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
                Confirmar minha inscrição
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <a href="${confirmUrl}" style="color:#2563EB;word-break:break-all;">${confirmUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;border-top:1px solid #e5e7eb;padding-top:24px;">
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                Este link expira em <strong>48 horas</strong>. Se você não se inscreveu, ignore este email — nenhuma ação é necessária.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2025 SystemForge ·
                <a href="https://forjadesistemas.com.br/privacidade" style="color:#9ca3af;">Política de Privacidade</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// =====================================================================
// NOTIF-002: Template HTML — Email de Boas-Vindas
// =====================================================================
function welcomeEmailHtml(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo(a)!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:48px;max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:24px;font-weight:700;color:#2563EB;">SystemForge</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <div style="font-size:48px;">&#x1F680;</div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#111827;line-height:1.3;">Bem-vindo(a) à newsletter SystemForge!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">Sua inscrição foi confirmada. A partir de agora você vai receber:</p>
              <ul style="margin:0;padding-left:24px;font-size:16px;color:#374151;line-height:1.8;">
                <li>Artigos técnicos sobre engenharia de software e arquitetura</li>
                <li>Tendências do mercado de tecnologia (SaaS, mobile, AI)</li>
                <li>Casos de uso reais de projetos desenvolvidos pela SystemForge</li>
                <li>Dicas práticas de desenvolvimento e boas práticas</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="https://forjadesistemas.com.br/blog"
                 style="display:inline-block;background-color:#2563EB;color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
                Explorar artigos
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
                Não quer mais receber nossas comunicações?
                <a href="${unsubscribeUrl}" style="color:#6b7280;">Cancelar inscrição</a>
                <br/>
                © 2025 SystemForge ·
                <a href="https://forjadesistemas.com.br/privacidade" style="color:#9ca3af;">Política de Privacidade</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// =====================================================================
// NOTIF-003: Template HTML — Email de Cancelamento
// =====================================================================
function cancellationEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inscrição cancelada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;padding:48px;max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:24px;font-weight:700;color:#2563EB;">SystemForge</div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Sua inscrição foi cancelada</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6;">
                Você foi removido(a) com sucesso da nossa newsletter. Não enviaremos mais comunicações para este endereço.
              </p>
              <p style="margin:0;font-size:16px;color:#374151;line-height:1.6;">
                Se foi um engano, você pode se inscrever novamente em qualquer momento em
                <a href="https://forjadesistemas.com.br/blog" style="color:#2563EB;">forjadesistemas.com.br/blog</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                © 2025 SystemForge ·
                <a href="https://forjadesistemas.com.br/privacidade" style="color:#9ca3af;">Política de Privacidade</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
