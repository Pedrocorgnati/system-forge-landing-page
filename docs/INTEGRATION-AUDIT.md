# Integration Audit — i18n-triple-market
**Data:** 2026-03-28
**Executor:** auto-flow execute / module-14-integration

---

## Resumo Executivo

| Gate | Status | Script | Detalhes |
|------|--------|--------|----------|
| Paridade de Conteúdo (TASK-1) | ⏳ PENDENTE | `npx tsx scripts/check-content-parity.ts` | 40 arquivos × 4 locales |
| Build Isolation (TASK-2) | ⏳ PENDENTE | `npx tsx scripts/check-build-isolation.ts` | Requer: npm run build:br/it/en |
| Hreflang Reciprocidade (TASK-3) | ⏳ PENDENTE | `npx tsx scripts/validate-hreflang-final.ts` | Gera: docs/HREFLANG-AUDIT.md |
| Broken Links (TASK-4) | ⏳ PENDENTE | `npx tsx scripts/check-broken-links.ts --internal-only` | Gera: docs/BROKEN-LINKS-AUDIT.md |
| Smoke Tests (TASK-5) | ⏳ PENDENTE | `bash scripts/smoke-test-full.sh` | Requer: domínios live (pós-deploy) |
| ECU Audit (TASK-6) | ⏳ PENDENTE | `bash scripts/audit-ecu.sh` | Zero Órfãos + Axe-core |
| TS/ESLint Gate (TASK-7) | ⏳ PENDENTE | CI: `.github/workflows/quality-gate.yml` | 4 ambientes × tsc + ESLint |

---

## Veredito Final
**⏳ PENDENTE — scripts criados, aguardando execução após builds**

---

## Como Executar

### Pré-requisito: rodar os 4 builds localmente
```bash
npm run build:br && npm run build:it && npm run build:en && npm run build:es
```

### Sequência de validação (pré-deploy)
```bash
# TASK-1: Content parity
npx tsx scripts/check-content-parity.ts

# TASK-2: Build isolation (após builds)
npx tsx scripts/check-build-isolation.ts

# TASK-3: Hreflang (após builds)
npx tsx scripts/validate-hreflang-final.ts

# TASK-4: Broken links (após builds)
npx tsx scripts/check-broken-links.ts --internal-only

# TASK-6: ECU audit
bash scripts/audit-ecu.sh
```

### Pós-deploy
```bash
# TASK-5: Smoke tests (requer domínios live)
bash scripts/smoke-test-full.sh
bash scripts/smoke-test-features.sh
bash scripts/smoke-test-workers.sh  # requer WORKER_BR/IT/EN env vars
```

### CI: Quality Gate (PRs e push para main)
O workflow `.github/workflows/quality-gate.yml` executa automaticamente:
- TypeScript check (4 locales)
- ESLint --max-warnings 0
- Content parity
- Frontmatter validation (4 locales)

---

## Arquivos Criados (module-14-integration)

| Arquivo | Descrição |
|---------|-----------|
| `scripts/check-content-parity.ts` | TASK-1: 40 arquivos × 4 locales |
| `scripts/check-build-isolation.ts` | TASK-2: zero cross-contamination |
| `scripts/validate-hreflang-final.ts` | TASK-3: hreflang reciprocity → docs/HREFLANG-AUDIT.md |
| `scripts/check-broken-links.ts` | TASK-4: broken links → docs/BROKEN-LINKS-AUDIT.md |
| `scripts/smoke-test-full.sh` | TASK-5: smoke tests 4 domínios |
| `scripts/smoke-test-features.sh` | TASK-5: funcionalidades (blog/contact/services) |
| `scripts/smoke-test-workers.sh` | TASK-5: Cloudflare Workers newsletter |
| `scripts/audit-ecu.sh` | TASK-6: ECU + Axe-core |
| `scripts/check-hardcodes.sh` | TASK-7: zero hardcodes pt-BR |
| `.github/workflows/quality-gate.yml` | TASK-7: CI gate para PRs → main |

---

## CI Changes

| Workflow | Modificação |
|----------|-------------|
| `.github/workflows/build.yml` | + `Check content parity` (pré-build, 1×) |
| `.github/workflows/build.yml` | + job `build-isolation-check` (pós-build, isolation + broken-links) |
| `.github/workflows/deploy.yml` | + job `post-deploy-smoke` (pós-deploy, smoke tests 3 domínios) |
| `.github/workflows/quality-gate.yml` | NOVO — quality gate para PRs |

---

## Itens Pendentes (ação manual necessária)

- [ ] **TASK-2/5**: Executar `npm run build:br && build:it && build:en` para gerar dist-br/dist-it/dist-en
- [ ] **TASK-3/4**: Executar `validate-hreflang-final.ts` e `check-broken-links.ts` após builds
- [ ] **TASK-5**: Executar smoke tests após deploy dos 3 domínios
- [ ] **TASK-5/ST003**: Configurar secrets `NEWSLETTER_WORKER_URL_BR/IT/EN` no GitHub para smoke tests de Workers
- [ ] **TASK-7**: Verificar se `eslint.config.mjs` tem `@typescript-eslint/no-explicit-any: 'error'` configurado

## Próximo Passo
- Builds prontos: Executar `/validate-pipeline` → `/deploy-checklist`
- Issues encontrados: Corrigir e re-executar scripts correspondentes
