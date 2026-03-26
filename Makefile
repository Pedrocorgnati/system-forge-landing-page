.PHONY: setup reset dev build lint help

# Bootstrap (gerado por /dev-bootstrap-create)
setup:
	@./scripts/bootstrap.sh

reset:
	@./scripts/bootstrap.sh --reset

health:
	@./scripts/bootstrap.sh --health

# Desenvolvimento
dev:
	npm run dev

build:
	npm run build

start:
	npm start

lint:
	npm run lint

# Utility
help:
	@echo "SystemForge Landing Page — Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  setup       — Setup completo do ambiente (instala deps, .env, etc)"
	@echo "  reset       — Limpa tudo e refaz o setup"
	@echo "  health      — Valida saúde do ambiente"
	@echo "  dev         — Inicia dev server (Next.js)"
	@echo "  build       — Build para produção"
	@echo "  start       — Inicia prod server"
	@echo "  lint        — ESLint"
	@echo ""
	@echo "Uso: make {target}"
