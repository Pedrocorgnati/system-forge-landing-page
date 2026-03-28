#!/usr/bin/env bash
# scripts/smoke-test-workers.sh
# Smoke tests dos Cloudflare Workers de newsletter nos 3 mercados.
#
# Uso:
#   bash scripts/smoke-test-workers.sh
#
# Requer variáveis de ambiente (ou .env.deploy):
#   WORKER_BR=https://worker-br.{account}.workers.dev/subscribe
#   WORKER_IT=https://worker-it.{account}.workers.dev/subscribe
#   WORKER_EN=https://worker-en.{account}.workers.dev/subscribe
#
# Se as variáveis não estiverem configuradas, o script pula gracefully (exit 0).
# INT-026 — module-14-integration / TASK-5/ST003

set -euo pipefail

# Carregar .env.deploy se existir
if [ -f ".env.deploy" ]; then
  # shellcheck disable=SC1091
  set -a; source .env.deploy; set +a
fi

# Verificar se workers estão configurados
if [ -z "${WORKER_BR:-}" ] && [ -z "${WORKER_IT:-}" ] && [ -z "${WORKER_EN:-}" ]; then
  echo "⚠️  Workers não configurados (WORKER_BR/IT/EN não definidos) — pulando smoke-test-workers"
  echo "   Defina em .env.deploy ou como variáveis de ambiente antes de usar este script"
  exit 0
fi

ERRORS=0

echo ""
echo "══════════════════════════════════════════════"
echo "  Smoke Tests — Cloudflare Workers Newsletter"
echo "══════════════════════════════════════════════"
echo ""

# ─── Worker BR ─────────────────────────────────────────────────────────────────
if [ -n "${WORKER_BR:-}" ]; then
  echo "▶ Worker BR — LGPD (consent obrigatório)"

  # Sem consent → deve retornar 400
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_BR" \
    -H "Content-Type: application/json" \
    -d '{"email":"smoke-test@example.com"}' \
    --max-time 15 2>/dev/null || echo "000")
  if [ "$STATUS" == "400" ]; then
    echo "  ✅ Sem consent → HTTP 400 (LGPD OK)"
  else
    echo "  ❌ Sem consent: esperado 400, recebido $STATUS"
    ERRORS=$((ERRORS + 1))
  fi

  # Com consent → deve retornar 200
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_BR" \
    -H "Content-Type: application/json" \
    -d '{"email":"smoke-test+br@example.com","consent":true}' \
    --max-time 15 2>/dev/null || echo "000")
  if [ "$STATUS" == "200" ] || [ "$STATUS" == "201" ]; then
    echo "  ✅ Com consent → HTTP $STATUS (subscription OK)"
  else
    echo "  ❌ Com consent: esperado 200/201, recebido $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ─── Worker IT ─────────────────────────────────────────────────────────────────
if [ -n "${WORKER_IT:-}" ]; then
  echo ""
  echo "▶ Worker IT — GDPR (double opt-in)"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_IT" \
    -H "Content-Type: application/json" \
    -d '{"email":"smoke-test+it@example.com"}' \
    --max-time 15 2>/dev/null || echo "000")
  if [ "$STATUS" == "200" ] || [ "$STATUS" == "201" ]; then
    echo "  ✅ IT subscription → HTTP $STATUS (double opt-in initiated)"
  else
    echo "  ❌ IT subscription: esperado 200/201, recebido $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ─── Worker EN ─────────────────────────────────────────────────────────────────
if [ -n "${WORKER_EN:-}" ]; then
  echo ""
  echo "▶ Worker EN — CAN-SPAM"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_EN" \
    -H "Content-Type: application/json" \
    -d '{"email":"smoke-test+en@example.com","consent":true}' \
    --max-time 15 2>/dev/null || echo "000")
  if [ "$STATUS" == "200" ] || [ "$STATUS" == "201" ]; then
    echo "  ✅ EN subscription → HTTP $STATUS"
  else
    echo "  ❌ EN subscription: esperado 200/201, recebido $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
fi

# ─── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
if [ $ERRORS -gt 0 ]; then
  echo "❌ FAIL: $ERRORS worker smoke test(s) falharam"
  exit 1
fi
echo "✅ PASS: Todos os Workers respondendo corretamente"
exit 0
