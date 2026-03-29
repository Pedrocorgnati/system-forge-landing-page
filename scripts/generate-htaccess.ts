/**
 * scripts/generate-htaccess.ts
 * Gera .htaccess específico por locale com CSP ajustada.
 *
 * IT não inclui GTM no script-src por padrão (GDPR — GTM carrega somente após
 * consentimento explícito via CMP do module-11). BR e EN incluem GTM.
 *
 * Usage:
 *   npx tsx scripts/generate-htaccess.ts --locale=br
 *   npx tsx scripts/generate-htaccess.ts --locale=it
 *   npx tsx scripts/generate-htaccess.ts --locale=en
 *   npx tsx scripts/generate-htaccess.ts --locale=es
 *   npx tsx scripts/generate-htaccess.ts --all
 *
 * Output: dist/{locale}/.htaccess
 *
 * Exit codes:
 *   0 — gerado com sucesso
 *   1 — locale inválido ou erro de I/O
 *
 * INT-027, module-12-compliance-seo
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// CSP por locale
// ---------------------------------------------------------------------------

const CSP_BY_LOCALE: Record<string, string> = {
  // BR: GTM habilitado (LGPD permite com aviso de cookies)
  // 'unsafe-eval' necessário para MDXContent (new Function) e Next.js chunks
  br: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.resend.com https://br-worker.workers.dev https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // IT: sem GTM por padrão (GDPR — GTM só carrega após consentimento explícito via CMP)
  // 'unsafe-eval' necessário para MDXContent (new Function) e Next.js chunks
  it: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.resend.com https://it-worker.workers.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // EN: GTM habilitado (CAN-SPAM/CCPA permite com opt-out)
  // 'unsafe-eval' necessário para MDXContent (new Function) e Next.js chunks
  en: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.resend.com https://en-worker.workers.dev https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // ES: sem GTM por padrão (GDPR — Espanha é EU — GTM só carrega após consentimento explícito via CMP)
  // 'unsafe-eval' necessário para MDXContent (new Function) e Next.js chunks
  es: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.resend.com https://es-worker.workers.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}

const VALID_LOCALES = Object.keys(CSP_BY_LOCALE)

// ---------------------------------------------------------------------------
// Geração do .htaccess
// ---------------------------------------------------------------------------

function generateHtaccess(locale: string): string {
  const csp = CSP_BY_LOCALE[locale]

  return `# ================================================================
# SystemForge Landing Page — .htaccess
# Locale: ${locale.toUpperCase()}
# Gerado por: scripts/generate-htaccess.ts
# NÃO editar manualmente — editar o script e regenerar
# ================================================================

# ----------------------------------------------------------------
# HTTPS e www redirect
# ----------------------------------------------------------------
<IfModule mod_rewrite.c>
  RewriteEngine On

  # Forçar HTTPS (redirect 301 permanente)
  # %{HTTP:X-Forwarded-Proto} cobre o caso do Cloudflare (proxy reverso)
  RewriteCond %{HTTPS} off
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

  # www → non-www redirect
  RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
  RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]

  # ----------------------------------------------------------------
  # Next.js Static Export — roteamento de URLs sem extensão
  # Problema: Next.js gera /blog.html mas a URL é /blog
  # Apache vê /blog/ (diretório existente) e redireciona → 403
  # Solução: desativar trailing slash automático e mapear para .html
  # ----------------------------------------------------------------
  Options -Indexes

  # Desabilita o redirect automático para / (causaria /blog → /blog/ → 403)
  DirectorySlash Off

  # Caso 1: URL com trailing slash sobre um diretório real (ex: /blog/)
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^(.+)/$ /$1.html [L]

  # Caso 2: URL sem extensão e sem trailing slash (ex: /blog, /servicos)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.+?)/?$ /$1.html [L]
</IfModule>

# ----------------------------------------------------------------
# Cache Headers
# ----------------------------------------------------------------
<IfModule mod_headers.c>
  # Assets estáticos — 1 ano (imutável, pois Next.js gera nomes com hash)
  <FilesMatch "\\.(webp|avif|png|jpg|jpeg|gif|svg|ico|woff2|woff|js|css|json)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # HTML — 1 hora (deve revalidar para pegar novo deploy)
  <FilesMatch "\\.html$">
    Header set Cache-Control "public, max-age=3600, must-revalidate"
  </FilesMatch>

  # Fontes — CORS para evitar bloqueio cross-origin
  <FilesMatch "\\.(woff2|woff|ttf|otf)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>

# ----------------------------------------------------------------
# Security Headers
# ----------------------------------------------------------------
<IfModule mod_headers.c>
  # Previne clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"

  # Previne MIME type sniffing
  Header always set X-Content-Type-Options "nosniff"

  # Controla informações no Referer
  Header always set Referrer-Policy "strict-origin-when-cross-origin"

  # Restringe APIs sensíveis do browser
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"

  # Content Security Policy — locale: ${locale.toUpperCase()}
${(locale === 'it' || locale === 'es') ? '  # GDPR: GTM ausente — carregado somente após consentimento explícito (module-11 CMP)\n' : ''}  Header always set Content-Security-Policy "${csp}"

  # HSTS — 1 ano, includeSubDomains
  # Nota: preload requer registro em hstspreload.org — ativar após validação
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# ----------------------------------------------------------------
# Compressão
# ----------------------------------------------------------------

# Brotli (se disponível no Hostinger — LiteSpeed suporta)
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS \\
    text/html \\
    text/css \\
    text/plain \\
    text/xml \\
    text/javascript \\
    application/javascript \\
    application/json \\
    application/xml \\
    image/svg+xml
</IfModule>

# Gzip (fallback universal)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE \\
    text/html \\
    text/css \\
    text/plain \\
    text/xml \\
    text/javascript \\
    application/javascript \\
    application/json \\
    application/xml \\
    image/svg+xml

  # Versões antigas do IE que não suportam compressão
  BrowserMatch ^Mozilla/4 gzip-only-text/html
  BrowserMatch ^Mozilla/4\\.0[678] no-gzip
  BrowserMatch \\bMSIE !no-gzip !gzip-only-text/html
</IfModule>

# ----------------------------------------------------------------
# Proteção de arquivos sensíveis
# ----------------------------------------------------------------
<FilesMatch "\\.(env|md|ts|tsx|lock|log)$">
  Require all denied
</FilesMatch>

# ----------------------------------------------------------------
# Custom Error Pages
# ----------------------------------------------------------------
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html
`
}

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

function writeHtaccess(locale: string): void {
  const outDir = path.resolve(process.cwd(), 'dist', locale)
  const outPath = path.join(outDir, '.htaccess')

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outPath, generateHtaccess(locale), 'utf-8')
  console.log(`✅ dist/${locale}/.htaccess gerado (CSP locale: ${locale.toUpperCase()})`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2)

  if (args.includes('--all')) {
    console.log('Gerando .htaccess para todos os locales...\n')
    for (const locale of VALID_LOCALES) {
      writeHtaccess(locale)
    }
    console.log('\n✅ Todos os arquivos .htaccess gerados em dist/{locale}/.htaccess')
    process.exit(0)
  }

  const localeArg = args.find(a => a.startsWith('--locale='))
  if (!localeArg) {
    console.error('❌ Argumento obrigatório: --locale=br|it|en (ou --all)')
    console.error('   Exemplo: npx tsx scripts/generate-htaccess.ts --locale=it')
    process.exit(1)
  }

  const locale = localeArg.replace('--locale=', '').toLowerCase()

  if (!VALID_LOCALES.includes(locale)) {
    console.error(`❌ Unknown locale: ${locale}. Use br, it, en or es`)
    process.exit(1)
  }

  writeHtaccess(locale)
  process.exit(0)
}

main()
