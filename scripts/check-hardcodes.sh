#!/usr/bin/env bash
# scripts/check-hardcodes.sh
# Audit Zero Hardcodes pt-BR — verifica strings pt-BR hardcodadas em src/
# (exceto config/ e scripts de validação).
#
# Uso:
#   bash scripts/check-hardcodes.sh        # blocking (exit 1 se encontrado)
#   bash scripts/check-hardcodes.sh --warn # apenas warnings (exit 0)
#
# INT-036..038 — module-14-integration / TASK-7/ST004

set -euo pipefail

WARN_ONLY=false
for arg in "$@"; do
  [ "$arg" == "--warn" ] && WARN_ONLY=true
done

ERRORS=0

echo ""
echo "══════════════════════════════════════════════"
echo "  Audit Zero Hardcodes pt-BR em src/"
echo "══════════════════════════════════════════════"

if [ ! -d "src" ]; then
  echo "⚠️  Diretório src/ não encontrado — pulando"
  exit 0
fi

# Strings de navegação em português hardcodadas (em contexto de JSX/strings)
declare -a PT_STRINGS=(
  "Serviços"
  "Sobre"
  "Contato"
  "Portfólio"
  "Início"
  "Privacidade"
)

for str in "${PT_STRINGS[@]}"; do
  FOUND=$(grep -r "\"${str}\"\|'${str}'" src/ --include="*.tsx" --include="*.ts" \
    --exclude-dir="config" 2>/dev/null | grep -v '^\s*//' | wc -l || echo 0)
  if [ "$FOUND" -gt 0 ]; then
    echo "❌ Hardcode pt-BR '${str}' em src/ ($FOUND ocorrência(s)):"
    grep -rn "\"${str}\"\|'${str}'" src/ --include="*.tsx" --include="*.ts" \
      --exclude-dir="config" 2>/dev/null | grep -v '^\s*//' | head -5
    ERRORS=$((ERRORS + 1))
  fi
done

# URL hardcodada do domínio BR em componentes
if [ -d "src" ]; then
  URL_FOUND=$(grep -r "forjadesistemas\.com\.br" src/ --include="*.tsx" --include="*.ts" \
    --exclude-dir="config" 2>/dev/null | grep -v '^\s*//' | wc -l || echo 0)
  if [ "$URL_FOUND" -gt 0 ]; then
    echo "❌ URL hardcodada 'forjadesistemas.com.br' em src/ ($URL_FOUND ocorrência(s)):"
    grep -rn "forjadesistemas\.com\.br" src/ --include="*.tsx" --include="*.ts" \
      --exclude-dir="config" 2>/dev/null | grep -v '^\s*//' | head -5
    ERRORS=$((ERRORS + 1))
  fi
fi

# URLs hardcodadas de domínios IT, EN e ES em componentes
for domain in "systemforge\.it" "systemforgesoftware\.com" "systemforge\.es"; do
  DOMAIN_FOUND=$(grep -r "$domain" src/ --include="*.tsx" --include="*.ts" \
    --exclude-dir="config" 2>/dev/null | grep -v '^\s*//' | wc -l || echo 0)
  if [ "$DOMAIN_FOUND" -gt 0 ]; then
    CLEAN_DOMAIN=$(echo "$domain" | sed 's/\\//g')
    echo "❌ URL hardcodada '${CLEAN_DOMAIN}' em src/ ($DOMAIN_FOUND ocorrência(s)):"
    grep -rn "$domain" src/ --include="*.tsx" --include="*.ts" \
      --exclude-dir="config" 2>/dev/null | grep -v '^\s*//' | head -5
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ Zero hardcodes pt-BR e zero URLs hardcodadas de domínio em src/ (exceto config/)"
  exit 0
fi

echo "━━━ Exceções permitidas ━━━"
echo "  config/sites/br.ts  — arquivo de config, hardcodes esperados"
echo "  scripts/validate-* — scripts de validação"
echo "  Comentários de código"
echo ""

if $WARN_ONLY; then
  echo "⚠️  $ERRORS tipo(s) de hardcode encontrado(s) (modo warning — não blocking)"
  exit 0
fi

echo "❌ $ERRORS tipo(s) de hardcode encontrado(s) — corrigir antes do deploy"
exit 1
