#!/usr/bin/env bash
# bootstrap.sh — Setup completo do ambiente local
# Gerado por /dev-bootstrap-create (SystemForge)
# Uso: ./scripts/bootstrap.sh [--reset|--health]
set -euo pipefail

# === Cores ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[bootstrap]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
err()  { echo -e "${RED}[erro]${NC} $*" >&2; }

# === Pré-requisitos ===
check_prereqs() {
  local missing=()
  local prereqs=("git" "node" "npm")

  for cmd in "${prereqs[@]}"; do
    command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd")
  done

  if [ ${#missing[@]} -gt 0 ]; then
    err "Faltando: ${missing[*]}"
    err "Instale os pré-requisitos acima e tente novamente."
    exit 1
  fi
  ok "Pré-requisitos verificados"
}

# === .env ===
ensure_env() {
  if [ -f .env.local ]; then
    ok ".env.local já existe"
    return
  fi
  if [ -f .env.example ]; then
    cp .env.example .env.local
    ok ".env.local criado a partir de .env.example"
    warn "Revise .env.local e preencha valores públicos/privados antes de continuar"
  else
    warn ".env.example não encontrado. Criar manualmente ou verificar /env-creation"
  fi
}

# === Dependências ===
install_deps() {
  log "Instalando dependências..."
  npm install
  ok "Dependências instaladas"
}

# === Health Check ===
check_health() {
  log "Verificando saúde do ambiente..."
  local errors=0

  # Verificar .env.local
  if [ -f .env.local ]; then
    ok ".env.local presente"
  else
    warn ".env.local ausente"
    errors=$((errors + 1))
  fi

  # Verificar node_modules
  if [ -d node_modules ]; then
    ok "node_modules presente"
  else
    warn "node_modules ausente"
    errors=$((errors + 1))
  fi

  # Verificar que Next.js está instalado
  if npm list next >/dev/null 2>&1; then
    ok "Next.js instalado"
  else
    warn "Next.js não encontrado"
    errors=$((errors + 1))
  fi

  if [ $errors -eq 0 ]; then
    ok "Ambiente saudável"
    return 0
  else
    warn "$errors problema(s) encontrado(s) — verifique acima"
    return 1
  fi
}

# === Resumo ===
show_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  BOOTSTRAP COMPLETO${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  Para iniciar o dev server:"
  echo "    npm run dev"
  echo "    Ou: make dev"
  echo ""
  echo "  Para rodar build:"
  echo "    npm run build"
  echo "    Ou: make build"
  echo ""
  echo "  Para resetar tudo:"
  echo "    ./scripts/bootstrap.sh --reset"
  echo "    Ou: make reset"
  echo ""
  echo "  Para health check:"
  echo "    ./scripts/bootstrap.sh --health"
  echo ""
}

# === Reset ===
do_reset() {
  warn "Resetando ambiente..."
  rm -rf node_modules .next dist build __pycache__ .venv 2>/dev/null || true
  rm -f .env.local package-lock.json 2>/dev/null || true
  ok "Ambiente limpo"
  do_setup
}

# === Setup principal ===
do_setup() {
  log "Iniciando bootstrap de system-forge-landing-page..."
  echo ""

  check_prereqs
  ensure_env
  install_deps
  check_health
  show_summary
}

# === Entrypoint ===
cd "$(dirname "$0")/.."

case "${1:-}" in
  --reset) do_reset ;;
  --health) check_health ;;
  *) do_setup ;;
esac
