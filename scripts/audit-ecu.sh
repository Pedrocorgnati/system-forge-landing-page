#!/usr/bin/env bash
# scripts/audit-ecu.sh
# Auditoria ECU — Experiência Completa do Usuário.
# Combina auditorias estáticas (grep) com verificações de acessibilidade.
#
# Uso:
#   bash scripts/audit-ecu.sh [--skip-axe]
#
# --skip-axe: pula o step do Axe-core (requer builds dist-* rodando)
#
# INT-033..035 — module-14-integration / TASK-6
# ECU Rules: Zero Órfãos, Zero Silêncio, Zero Estados Indefinidos

set -euo pipefail

SKIP_AXE=false
for arg in "$@"; do
  [ "$arg" == "--skip-axe" ] && SKIP_AXE=true
done

TOTAL_ERRORS=0
TOTAL_WARNINGS=0

echo ""
echo "══════════════════════════════════════════════"
echo "  ECU Audit — Experiência Completa do Usuário"
echo "══════════════════════════════════════════════"

# ──────────────────────────────────────────────────────────────────────────────
# ST001: Zero Órfãos — botões e links sem destino
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ ST001 — Zero Órfãos (botões/links sem destino)"

ORPHAN_BUTTONS=0
ORPHAN_LINKS=0
EMPTY_HREFS=0

if [ -d "src" ]; then
  ORPHAN_BUTTONS=$(grep -r 'onClick={undefined}\|onClick={null}\|onClick=""' src/ --include="*.tsx" 2>/dev/null | wc -l || echo 0)
  # Exclui âncoras com ID (#alguma-coisa) — são âncoras funcionais
  ORPHAN_LINKS=$(grep -rn 'href="#"' src/ --include="*.tsx" 2>/dev/null | grep -v 'aria-\|role=\|onClick=' | wc -l || echo 0)
  EMPTY_HREFS=$(grep -rn 'href=""' src/ --include="*.tsx" 2>/dev/null | grep -v 'disabled' | wc -l || echo 0)
fi

[ "$ORPHAN_BUTTONS" -gt 0 ] && { echo "  ❌ $ORPHAN_BUTTONS botão(ões) com onClick inválido"; TOTAL_ERRORS=$((TOTAL_ERRORS + ORPHAN_BUTTONS)); } || echo "  ✅ Zero botões com onClick inválido"
[ "$ORPHAN_LINKS" -gt 0 ]   && { echo "  ❌ $ORPHAN_LINKS link(s) href='#' sem purpose"; TOTAL_ERRORS=$((TOTAL_ERRORS + ORPHAN_LINKS)); } || echo "  ✅ Zero links href='#' sem purpose"
[ "$EMPTY_HREFS" -gt 0 ]    && { echo "  ❌ $EMPTY_HREFS <Link href=''> vazio(s)"; TOTAL_ERRORS=$((TOTAL_ERRORS + EMPTY_HREFS)); } || echo "  ✅ Zero <Link href=''>"

# ──────────────────────────────────────────────────────────────────────────────
# ST002: Zero Silêncio — estados de feedback
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ ST002 — Zero Silêncio (estados de feedback nos componentes)"

NEWSLETTER_FILE=$(find src/ -name "NewsletterOptIn*" -o -name "newsletter-opt-in*" 2>/dev/null | head -1 || echo "")

if [ -n "$NEWSLETTER_FILE" ]; then
  MISSING_STATES=0
  for state in idle loading success error; do
    grep -qi "$state" "$NEWSLETTER_FILE" 2>/dev/null || { echo "  ❌ NewsletterOptIn: estado '$state' não encontrado"; TOTAL_ERRORS=$((TOTAL_ERRORS + 1)); MISSING_STATES=$((MISSING_STATES + 1)); }
  done
  grep -qi "pending.confirmation\|pendingConfirmation\|pending_confirmation" "$NEWSLETTER_FILE" 2>/dev/null \
    || { echo "  ❌ NewsletterOptIn: estado 'pending-confirmation' não encontrado (necessário para GDPR IT)"; TOTAL_ERRORS=$((TOTAL_ERRORS + 1)); MISSING_STATES=$((MISSING_STATES + 1)); }
  [ $MISSING_STATES -eq 0 ] && echo "  ✅ NewsletterOptIn: 5 estados presentes (idle/loading/success/error/pending-confirmation)"
else
  echo "  ⚠️  NewsletterOptIn não encontrado em src/ — verificar manualmente"
  TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
fi

# window.location.href em componentes React
if [ -d "src" ]; then
  WINDOW_HREF=$(grep -r 'window\.location\.href' src/ --include="*.tsx" 2>/dev/null | grep -v '//' | wc -l || echo 0)
  [ "$WINDOW_HREF" -gt 0 ] && { echo "  ❌ $WINDOW_HREF uso(s) de window.location.href (usar useRouter de next/navigation)"; TOTAL_ERRORS=$((TOTAL_ERRORS + WINDOW_HREF)); } || echo "  ✅ Zero window.location.href em componentes"
fi

# ──────────────────────────────────────────────────────────────────────────────
# ST003: Empty States
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ ST003 — Empty States"

if [ -d "src" ]; then
  EMPTY_SEARCH=$(grep -r 'EmptyStateSearch\|empty.*search\|no.*results' src/ --include="*.tsx" -qi 2>/dev/null && echo 1 || echo 0)
  EMPTY_PORTFOLIO=$(grep -r 'EmptyStatePortfolio\|empty.*portfolio\|no.*projects' src/ --include="*.tsx" -qi 2>/dev/null && echo 1 || echo 0)
  BLOG_EMPTY=$(grep -r 'articles\.length.*===.*0\|posts\.length.*===.*0\|!.*articles\|!.*posts' src/ --include="*.tsx" -q 2>/dev/null && echo 1 || echo 0)

  [ "$EMPTY_SEARCH" == "1" ]    && echo "  ✅ EmptyState de busca detectado" || { echo "  ⚠️  EmptyStateSearch não detectado — verificar manualmente"; TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1)); }
  [ "$EMPTY_PORTFOLIO" == "1" ] && echo "  ✅ EmptyState de portfolio detectado" || { echo "  ⚠️  EmptyStatePortfolio não detectado — verificar manualmente"; TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1)); }
  [ "$BLOG_EMPTY" == "1" ]      && echo "  ✅ Empty state de blog list detectado" || { echo "  ⚠️  Empty state de blog list não detectado — verificar manualmente"; TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1)); }
fi

# ──────────────────────────────────────────────────────────────────────────────
# ST004: LanguageSuggestionBanner e CookieBanner
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ ST004 — LanguageSuggestionBanner e CookieBanner"

if [ -d "src" ]; then
  # LanguageSuggestionBanner: localStorage dismiss
  LANG_DISMISS=$(grep -r 'localStorage.*lang\|lang.*localStorage\|dismissLanguage\|languageDismiss\|sf-lang' src/ --include="*.tsx" -q 2>/dev/null && echo 1 || echo 0)
  [ "$LANG_DISMISS" == "1" ] && echo "  ✅ LanguageSuggestionBanner: dismiss localStorage detectado" || { echo "  ⚠️  LanguageSuggestionBanner: dismiss localStorage não detectado"; TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1)); }

  # LanguageSuggestionBanner: role="alert"
  LANG_BANNER_FILE=$(find src/ -name "LanguageSuggestionBanner*" 2>/dev/null | head -1 || echo "")
  if [ -n "$LANG_BANNER_FILE" ]; then
    grep -q 'role="alert"' "$LANG_BANNER_FILE" 2>/dev/null \
      && echo "  ✅ LanguageSuggestionBanner: role='alert' presente" \
      || { echo "  ⚠️  LanguageSuggestionBanner: role='alert' ausente (acessibilidade)"; TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1)); }
  fi

  # CookieBanner: localStorage consent
  COOKIE_CONSENT=$(grep -r 'localStorage.*consent\|consent.*localStorage\|cookie.*consent\|cookieConsent\|consentMode' src/ --include="*.tsx" -qi 2>/dev/null && echo 1 || echo 0)
  [ "$COOKIE_CONSENT" == "1" ] && echo "  ✅ CookieBanner: localStorage de consentimento detectado" || { echo "  ❌ CookieBanner: localStorage de consentimento não detectado"; TOTAL_ERRORS=$((TOTAL_ERRORS + 1)); }
fi

# ──────────────────────────────────────────────────────────────────────────────
# ST005: Axe-core (acessibilidade — requer builds locais)
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo "▶ ST005 — Axe-core Accessibility Audit"

if $SKIP_AXE; then
  echo "  ⏭️  Pulado (--skip-axe)"
elif ! command -v npx &>/dev/null; then
  echo "  ⚠️  npx não encontrado — pulando Axe-core"
  TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
elif [ ! -d "dist-br" ] || [ ! -d "dist-it" ] || [ ! -d "dist-en" ]; then
  echo "  ⚠️  Builds dist-br/dist-it/dist-en não encontrados — execute npm run build:br/it/en primeiro"
  echo "      Axe-core será executado após os builds"
  TOTAL_WARNINGS=$((TOTAL_WARNINGS + 1))
else
  # Instalar serve se não disponível
  if ! npx serve --version &>/dev/null 2>&1; then
    echo "  ℹ️  Instalando 'serve'..."
    npm install --no-save serve &>/dev/null
  fi

  AXE_ERRORS=0

  # Iniciar servidores locais
  npx serve dist-br -p 3011 --no-clipboard &>/dev/null &
  PID_BR=$!
  npx serve dist-it -p 3012 --no-clipboard &>/dev/null &
  PID_IT=$!
  npx serve dist-en -p 3013 --no-clipboard &>/dev/null &
  PID_EN=$!
  sleep 3

  for port_locale in "3011:pt-BR" "3012:it-IT" "3013:en"; do
    IFS=: read -r port locale <<< "$port_locale"
    echo "  Testando locale $locale (porta $port)..."
    AXE_RESULT=$(npx @axe-core/cli "http://localhost:$port" 2>&1 || true)
    if echo "$AXE_RESULT" | grep -qi "critical\|serious"; then
      echo "  ❌ Axe-core violations em $locale:"
      echo "$AXE_RESULT" | grep -iE "critical|serious|violation" | head -10
      AXE_ERRORS=$((AXE_ERRORS + 1))
      TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
    else
      echo "  ✅ $locale: 0 critical/serious violations"
    fi
  done

  # Finalizar servidores
  kill $PID_BR $PID_IT $PID_EN 2>/dev/null || true

  if [ $AXE_ERRORS -eq 0 ]; then
    echo "  ✅ Axe-core: 0 critical/serious violations nos 3 locales"
  fi
fi

# ──────────────────────────────────────────────────────────────────────────────
# Resumo
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  ECU Audit — Resumo"
echo "  Erros: $TOTAL_ERRORS | Avisos: $TOTAL_WARNINGS"
echo "══════════════════════════════════════════════"

if [ $TOTAL_ERRORS -gt 0 ]; then
  echo "❌ ECU AUDIT REPROVADO: $TOTAL_ERRORS erro(s)"
  exit 1
fi
echo "✅ ECU AUDIT APROVADO (warnings: $TOTAL_WARNINGS — revisar manualmente)"
exit 0
