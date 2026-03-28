.PHONY: setup reset dev build lint help docker-dev docker-down docker-clean docker-build-br docker-build-it docker-build-en

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

# Docker
docker-dev:
	docker compose up

docker-down:
	docker compose down

docker-clean:
	docker compose down -v

docker-build-br:
	docker build --build-arg LOCALE=br -t system-forge-landing-page:br .

docker-build-it:
	docker build --build-arg LOCALE=it -t system-forge-landing-page:it .

docker-build-en:
	docker build --build-arg LOCALE=en -t system-forge-landing-page:en .

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
	@echo "Docker:"
	@echo "  docker-dev       — docker compose up (hot reload)"
	@echo "  docker-down      — docker compose down"
	@echo "  docker-clean     — docker compose down -v (remove volumes)"
	@echo "  docker-build-br  — Build imagem PT-BR (nginx + static export)"
	@echo "  docker-build-it  — Build imagem IT"
	@echo "  docker-build-en  — Build imagem EN"
	@echo ""
	@echo "Uso: make {target}"
