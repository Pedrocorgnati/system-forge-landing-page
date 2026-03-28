#!/usr/bin/env bash
# scripts/smoke-test.sh
# Smoke test para multi-market: HTTP 200 + keyword + lang attribute
#
# Usage:
#   ./scripts/smoke-test.sh <url> <keyword> <expected-lang>
#
# Exemplos:
#   ./scripts/smoke-test.sh https://forjadesistemas.com.br "Forja de Sistemas" "pt-BR"
#   ./scripts/smoke-test.sh https://systemforge.it "SystemForge" "it"
#   ./scripts/smoke-test.sh https://systemforgesoftware.com "SystemForge Software" "en"
#
# Exit codes:
#   0 - PASS: todos os checks passaram
#   1 - FAIL: um ou mais checks falharam

set -euo pipefail

URL="$1"
KEYWORD="$2"
EXPECTED_LANG="$3"
TIMEOUT=30
MAX_RETRIES=3
RETRY_DELAY=5

# Colors (disabled fora de terminal interativo)
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RESET='\033[0m'; BOLD='\033[1m'
else
  RED=''; GREEN=''; YELLOW=''; RESET=''; BOLD=''
fi

log_ok()   { echo -e "${GREEN}[PASS]${RESET} $1"; }
log_fail() { echo -e "${RED}[FAIL]${RESET} $1"; }
log_info() { echo -e "${YELLOW}[INFO]${RESET} $1"; }

# Validar argumentos
if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <url> <keyword> <expected-lang>"
  echo "Ex: $0 https://forjadesistemas.com.br 'Forja de Sistemas' 'pt-BR'"
  exit 1
fi

echo ""
echo -e "${BOLD}Smoke Test: $URL${RESET}"
echo "----------------------------------------"

attempt=1
http_code=""
body=""

while [[ $attempt -le $MAX_RETRIES ]]; do
  log_info "Attempt $attempt/$MAX_RETRIES — fetching $URL..."

  http_code=$(curl -sL --max-time "$TIMEOUT" -o /tmp/smoke-body.html -w "%{http_code}" "$URL" 2>/dev/null) || http_code="000"
  body=$(cat /tmp/smoke-body.html 2>/dev/null) || body=""

  if [[ "$http_code" == "200" ]]; then
    break
  fi

  log_info "Got HTTP $http_code — retrying in ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
  attempt=$((attempt + 1))
done

# Limpar arquivo temporário
rm -f /tmp/smoke-body.html

# Check 1: HTTP 200
if [[ "$http_code" != "200" ]]; then
  log_fail "HTTP $http_code after $MAX_RETRIES attempts (expected 200)"
  exit 1
fi
log_ok "HTTP 200 OK"

# Check 2: Keyword no HTML
if ! echo "$body" | grep -q "$KEYWORD"; then
  log_fail "Keyword '$KEYWORD' não encontrada no HTML"
  exit 1
fi
log_ok "Keyword '$KEYWORD' presente"

# Check 3: Lang attribute
if ! echo "$body" | grep -qE "lang=['\"]$EXPECTED_LANG['\"]"; then
  log_fail "lang='$EXPECTED_LANG' não encontrado no HTML"
  exit 1
fi
log_ok "lang='$EXPECTED_LANG' correto"

echo ""
log_ok "PASS: Smoke test completo para $URL"
exit 0
