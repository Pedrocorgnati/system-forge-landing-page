#!/usr/bin/env bash
# scripts/smoke-test-full.sh
# Smoke tests completos nos 3 domínios do triple-market.
# Wrapper orquestrador sobre scripts/smoke-test.sh por domínio.
#
# Uso:
#   bash scripts/smoke-test-full.sh
#
# Pré-requisito: domínios DEVEM estar no ar (pós-deploy).
# INT-026, INT-032 — module-14-integration / TASK-5
# Saída: exit 0 = todos OK | exit 1 = algum falhou

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0

echo ""
echo "══════════════════════════════════════════════"
echo "  Smoke Tests — Quad Market (4 domínios)"
echo "══════════════════════════════════════════════"
echo ""

# ─── Domínio BR ────────────────────────────────────────────────────────────────
echo "▶ [1/3] Brasil — forjadesistemas.com.br"
if bash "$SCRIPT_DIR/smoke-test.sh" "https://forjadesistemas.com.br" "Forja de Sistemas" "pt-BR"; then
  echo "  ✅ BR: PASS"
else
  echo "  ❌ BR: FAIL"
  ERRORS=$((ERRORS + 1))
fi

# sitemap.xml e robots.txt BR
echo ""
echo "  Verificando sitemap.xml e robots.txt..."
SITEMAP_BR=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://forjadesistemas.com.br/sitemap.xml" 2>/dev/null || echo "000")
ROBOTS_BR=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://forjadesistemas.com.br/robots.txt" 2>/dev/null || echo "000")
[ "$SITEMAP_BR" == "200" ] && echo "  ✅ sitemap.xml: HTTP 200" || { echo "  ❌ sitemap.xml: HTTP $SITEMAP_BR"; ERRORS=$((ERRORS + 1)); }
[ "$ROBOTS_BR" == "200" ] && echo "  ✅ robots.txt: HTTP 200" || echo "  ⚠️  robots.txt: HTTP $ROBOTS_BR (non-blocking)"

# ─── Domínio IT ────────────────────────────────────────────────────────────────
echo ""
echo "▶ [2/3] Itália — systemforge.it"
if bash "$SCRIPT_DIR/smoke-test.sh" "https://systemforge.it" "SystemForge" "it"; then
  echo "  ✅ IT: PASS"
else
  echo "  ❌ IT: FAIL"
  ERRORS=$((ERRORS + 1))
fi

SITEMAP_IT=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://systemforge.it/sitemap.xml" 2>/dev/null || echo "000")
ROBOTS_IT=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://systemforge.it/robots.txt" 2>/dev/null || echo "000")
[ "$SITEMAP_IT" == "200" ] && echo "  ✅ sitemap.xml: HTTP 200" || { echo "  ❌ sitemap.xml: HTTP $SITEMAP_IT"; ERRORS=$((ERRORS + 1)); }
[ "$ROBOTS_IT" == "200" ] && echo "  ✅ robots.txt: HTTP 200" || echo "  ⚠️  robots.txt: HTTP $ROBOTS_IT"

# ─── Domínio EN ────────────────────────────────────────────────────────────────
echo ""
echo "▶ [3/4] English — systemforgesoftware.com"
if bash "$SCRIPT_DIR/smoke-test.sh" "https://systemforgesoftware.com" "SystemForge Software" "en"; then
  echo "  ✅ EN: PASS"
else
  echo "  ❌ EN: FAIL"
  ERRORS=$((ERRORS + 1))
fi

SITEMAP_EN=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://systemforgesoftware.com/sitemap.xml" 2>/dev/null || echo "000")
ROBOTS_EN=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://systemforgesoftware.com/robots.txt" 2>/dev/null || echo "000")
[ "$SITEMAP_EN" == "200" ] && echo "  ✅ sitemap.xml: HTTP 200" || { echo "  ❌ sitemap.xml: HTTP $SITEMAP_EN"; ERRORS=$((ERRORS + 1)); }
[ "$ROBOTS_EN" == "200" ] && echo "  ✅ robots.txt: HTTP 200" || echo "  ⚠️  robots.txt: HTTP $ROBOTS_EN"

# ─── Domínio ES ────────────────────────────────────────────────────────────────
echo ""
echo "▶ [4/4] Español — systemforge.es"
if bash "$SCRIPT_DIR/smoke-test.sh" "https://systemforge.es" "SystemForge" "es"; then
  echo "  ✅ ES: PASS"
else
  echo "  ❌ ES: FAIL"
  ERRORS=$((ERRORS + 1))
fi

SITEMAP_ES=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://systemforge.es/sitemap.xml" 2>/dev/null || echo "000")
ROBOTS_ES=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "https://systemforge.es/robots.txt" 2>/dev/null || echo "000")
[ "$SITEMAP_ES" == "200" ] && echo "  ✅ sitemap.xml: HTTP 200" || { echo "  ❌ sitemap.xml: HTTP $SITEMAP_ES"; ERRORS=$((ERRORS + 1)); }
[ "$ROBOTS_ES" == "200" ] && echo "  ✅ robots.txt: HTTP 200" || echo "  ⚠️  robots.txt: HTTP $ROBOTS_ES"

# ─── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
if [ $ERRORS -gt 0 ]; then
  echo "❌ FAIL: $ERRORS domínio(s) com erros"
  exit 1
fi
echo "✅ PASS: Todos os 4 domínios passaram no smoke test"
exit 0
