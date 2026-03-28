#!/usr/bin/env bash
# scripts/smoke-test-features.sh
# Smoke tests de funcionalidades i18n-triple-market nos 3 domínios.
# Verifica blog listing, contact page e slug nativo por locale.
#
# Uso:
#   bash scripts/smoke-test-features.sh
#
# INT-026 — module-14-integration / TASK-5/ST002

set -euo pipefail

ERRORS=0

echo ""
echo "══════════════════════════════════════════════"
echo "  Smoke Tests de Funcionalidades — i18n"
echo "══════════════════════════════════════════════"

# ─── Blog listings ─────────────────────────────────────────────────────────────
echo ""
echo "▶ Blog listing pages..."

declare -a BLOG_URLS=(
  "https://forjadesistemas.com.br/blog:BR"
  "https://systemforge.it/blog:IT"
  "https://systemforgesoftware.com/blog:EN"
)

for url_locale in "${BLOG_URLS[@]}"; do
  IFS=: read -r url locale <<< "$url_locale"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
  if [ "$STATUS" == "200" ]; then
    echo "  ✅ Blog ($locale): $url — HTTP 200"
  else
    echo "  ❌ Blog ($locale): $url — HTTP $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── Contact pages (slug nativo) ───────────────────────────────────────────────
echo ""
echo "▶ Contact pages (slug nativo por locale)..."

declare -A CONTACT_URLS
CONTACT_URLS["BR"]="https://forjadesistemas.com.br/contato"
CONTACT_URLS["IT"]="https://systemforge.it/contatti"
CONTACT_URLS["EN"]="https://systemforgesoftware.com/contact"

for locale in BR IT EN; do
  url="${CONTACT_URLS[$locale]}"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
  if [ "$STATUS" == "200" ]; then
    echo "  ✅ Contact ($locale): $url — HTTP 200"
  else
    echo "  ❌ Contact ($locale): $url — HTTP $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── Services pages (slug nativo) ─────────────────────────────────────────────
echo ""
echo "▶ Services pages (slug nativo por locale)..."

declare -A SERVICE_URLS
SERVICE_URLS["BR"]="https://forjadesistemas.com.br/servicos"
SERVICE_URLS["IT"]="https://systemforge.it/servizi"
SERVICE_URLS["EN"]="https://systemforgesoftware.com/services"

for locale in BR IT EN; do
  url="${SERVICE_URLS[$locale]}"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")
  if [ "$STATUS" == "200" ]; then
    echo "  ✅ Services ($locale): $url — HTTP 200"
  else
    echo "  ❌ Services ($locale): $url — HTTP $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
done

# ─── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
if [ $ERRORS -gt 0 ]; then
  echo "❌ FAIL: $ERRORS feature smoke test(s) falharam"
  exit 1
fi
echo "✅ PASS: Todas as funcionalidades verificadas"
exit 0
