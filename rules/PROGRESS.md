# PROGRESS — Correção quad-market + criação das rules

Última atualização: 2026-05-19 18:55 UTC

Este arquivo trackeia as etapas de correção do pipeline de publicação
multidomínio (BR/IT/EN/ES) + criação dos 3 arquivos de rules canônicas.
Cada etapa inclui:
- Status (`pending` / `in-progress` / `done`).
- Checagem controversial (codex MCP — achados adversariais).
- Hardening aplicado (correção concreta aplicada).
- Evidência objetiva (commit SHA, log gh, probe HTTP, etc).

---

## Resumo executivo

| # | Etapa | Status | Codex review | Hardening | Evidência |
|---|---|---|---|---|---|
| 1 | Restaurar disparo automático Build→Deploy | done | sim | sim | run 26113715503 (build) → 26113968516 (deploy success 44m42s) |
| 2 | Fix schema mismatch `description`/`excerpt` | done | sim | sim | `scripts/promote-from-stockpile.ts:107-131` (splice insert pós-validação) |
| 3 | Resolver `.run-lock.json` tracked (`pull --rebase`) | done (mitigação) | sim | parcial | `--autostash` aplicado; remoção do índice ainda pendente (P0) |
| 4 | Smoke pós-deploy operacional | done | sim | sim | `deploy.yml:470` `post-deploy-smoke` ativo nos 4 domínios |
| 5 | Quad probe HTTP em produção | done | n/a | n/a | 4 domínios HTTP 200 + `last-modified` 2026-05-19 |
| 6 | Criar `rules/commit-multilanguage.md` | done | sim (5 achados) | sim | arquivo no repo, codex thread 019e4168 |
| 7 | Criar `rules/auto-publishable-blog.md` | done | sim (8 achados) | sim | arquivo no repo, codex thread 019e416e |
| 8 | Criar `rules/multi-domain-rules.md` | done | sim (6 achados) | sim | arquivo no repo, codex thread 019e4175 |
| 9 | Verificação blog automático em produção | done | n/a | gaps mapeados | ver §9 abaixo |
| 10 | Resolução dos gaps via pair-codex | done | sim (thread 019e418c) | 4 commits + 1 playbook + 1 auditoria | ver §9.5 atualizado |

---

## 1. Etapa: Restaurar disparo automático Build→Deploy

**Problema raiz:** pushes feitos com `GITHUB_TOKEN` (bot do promote) não
disparam workflows secundários. `build.yml` rodava por push, mas `deploy.yml`
em `workflow_run` não encadeava de volta quando o build veio de
`workflow_dispatch`. Sintoma: builds rodando, deploy nunca disparando para
commits do bot.

**Codex (controversial check):**
- Confirmou que `deploy.yml` declara `actions/download-artifact@v4` em 4 jobs
  e cada um precisa de `run-id` quando o caller não é o `workflow_run.id`
  natural.
- Alertou para risco de duplicação (workflow_run + workflow_dispatch
  coexistindo) — mitigado pelo gate `if: github.event_name ==
  'workflow_dispatch'` em `build.yml:197`.

**Hardening:**
- `build.yml` ganhou job `dispatch-deploy` que dispara `deploy.yml` via
  `gh workflow run deploy.yml -f build_run_id=${{ github.run_id }}` (linha 191+).
- `deploy.yml` aceita `inputs.build_run_id` e cada `download-artifact` usa
  fallback `${{ github.event.workflow_run.id || inputs.build_run_id }}`
  (`deploy.yml:59, 169, 277, 385`).

**Evidência objetiva:**
```
gh run list --workflow=deploy.yml --limit=3
26113968516  Quad Market Deploy  success  workflow_run     44m42s  2026-05-19T17:29:40Z
26113860069  Quad Market Deploy  cancelled  workflow_dispatch  3m1s  2026-05-19T17:27:37Z (cancel-in-progress)
26113635443  Quad Market Deploy  cancelled  workflow_run     5m26s  2026-05-19T17:23:12Z (cancel-in-progress)
```

Último deploy (26113968516) success.

---

## 2. Etapa: Fix schema mismatch `description`/`excerpt`

**Problema raiz:** `PostFrontmatterSchema` (Zod) exige `excerpt` (min 50, max
300). O gerador stockpile emitia `description` em vez de `excerpt` →
`promote-from-stockpile.ts` skipava todos os pacotes.

**Codex (controversial check):**
- Confirmou que a ordem real do script é: parse → injetar
  `parsed.data.excerpt = description` em memória → **validar Zod** →
  só então fazer splice no raw inserindo `excerpt:` após linha
  `description:`.
- Apontou que se `description` > 300 chars, o Zod rejeita antes do splice
  (não trunca — preserva SEO).

**Hardening:**
- `scripts/promote-from-stockpile.ts:107-131` aplica o compat shim correto
  (insert, não replace; validação antes do splice).
- Documentado em `rules/auto-publishable-blog.md` §3.

**Evidência objetiva:**
8 pacotes em estado `promoted` no stockpile (`find … -exec grep …`).
Pipeline promove sem skipar mais.

---

## 3. Etapa: Resolver `.run-lock.json` tracked

**Problema raiz:** `.claude/blog/data/stockpile/.run-lock.json` está versionado
no repo (`git ls-files | grep run-lock` retorna match) E **não** está no
`.gitignore`. Toda execução do promote toca esse arquivo, deixando working
tree sujo, o que faz `pull --rebase` falhar.

**Codex (controversial check):**
- Marcou como **BLOCKER** P0: lock é estado local efêmero, nunca deve ser
  versionado.
- `--autostash` é mitigação, não correção.

**Hardening (parcial):**
- Mitigação imediata: `scripts/promote-from-stockpile.ts` agora chama
  `git pull --rebase --autostash` (não quebra mais).
- **Pendente (P0 documentado):**
  - `git rm --cached .claude/blog/data/stockpile/.run-lock.json`
  - Adicionar `/.claude/blog/data/stockpile/.run-lock.json` ao `.gitignore`.
- Documentado em `rules/auto-publishable-blog.md` §3.

**Evidência objetiva:**
Bash verificou: `git ls-files | grep run-lock` retorna o caminho;
`.gitignore` não contém `run-lock`. Mitigação `--autostash` já aplicada no
script TS.

---

## 4. Etapa: Smoke pós-deploy operacional

**Problema raiz:** suspeita inicial de que `smoke-test.yml` era o "elo 5"
quebrado do pipeline. Investigação codex revelou que **não é** — o smoke
efetivo vive no próprio `deploy.yml`.

**Codex (controversial check):**
- BLOCKER: a alegação anterior de "elo 5 quebrado" estava errada. `deploy.yml`
  já tem job `post-deploy-smoke` (linha 470) com
  `needs: [deploy-br, deploy-it, deploy-en, deploy-es]` rodando
  `bash scripts/smoke-test-full.sh` nos 4 domínios.
- `smoke-test.yml` separado é legado: nome ("Triple Market Deploy") não casa
  com deploy real ("Quad Market Deploy") e falta `smoke-es`.

**Hardening:**
- Documentação corrigida em `rules/auto-publishable-blog.md` §1 e §6.
- Decisão pendente sobre `smoke-test.yml` legado: deletar (preferível) ou
  consertar nome+ES e manter como camada redundante (P2 documentado).

**Evidência objetiva:**
- `grep "post-deploy-smoke" .github/workflows/deploy.yml` → match linha 470.
- Run mais recente do deploy (26113968516) terminou success em 44m42s,
  incluindo `post-deploy-smoke`.

---

## 5. Etapa: Quad probe HTTP em produção

**Verificação:**
```
https://forjadesistemas.com.br      → HTTP 200 (last-mod: Tue, 19 May 2026 18:09:20 GMT)
https://systemforge.it              → HTTP 200 (last-mod: Tue, 19 May 2026 17:50:38 GMT)
https://systemforgesoftware.com     → HTTP 200 (last-mod: Tue, 19 May 2026 17:50:33 GMT)
https://systemforge.es              → HTTP 200 (last-mod: Tue, 19 May 2026 17:51:29 GMT)
```

Os 4 mercados responderam HTTP 200 com `last-modified` no mesmo dia (hoje
2026-05-19) — confirmando que o deploy mais recente propagou via Cloudflare
para todos os SFTP targets.

---

## 6. Etapa: Criar `rules/commit-multilanguage.md`

**Codex thread:** `019e4168-2d9b-7053-8fca-5fd2688646b3` (gpt-5.2, read-only).

**Achados aplicados (5):**
1. BLOCKER: exemplo "20 articles" violava cap `AGENTS.md:29` (max 4) → corrigido para 4.
2. ERROR: claim falsa de que Velite importa `PostFrontmatterSchema` → corrigido (mirror inline `max(300)`, sem `min(50)`).
3. ERROR: referência a `pretool-bash-secrets.sh`/`atomic-verifier` (não existem neste repo) → removida.
4. WARN: step `Push (se houve commit)` mascara erro real → documentado com 3 opções de fix.
5. WARN: parity "40×4" ambíguo → corrigido para "10 pages × 4 locales".

**Hardening adicional:**
- §10.7 esclarece que o log do script ainda diz "10×3" (stale).
- §10.8 adicionado: `hreflang-validator.ts` é o validador correto da
  reciprocidade hreflang (separado do parity).

---

## 7. Etapa: Criar `rules/auto-publishable-blog.md`

**Codex thread:** `019e416e-d34d-77b2-b57b-2180282c6488` (gpt-5.2, read-only).

**Achados aplicados (8):**
1. BLOCKER: §1/§6 — "elo 5 broken" estava errado; `post-deploy-smoke` cobre os 4 domínios.
2. ERROR: §4 — `build.yml` não tem `workflow_run` trigger (só push/PR/dispatch).
3. ERROR: §4.1 — `deploy.yml` tem duplo trigger (workflow_run + workflow_dispatch); risco documentado.
4. BLOCKER: §3 — `.run-lock.json` tracked + sem `.gitignore` flagado como P0.
5. ERROR: §3 — splice é INSERT após `description:`, não REPLACE; validação antes do splice.
6. WARN: §5 — `cancel-in-progress: true` pode deixar SFTP em estado parcial.
7. INFO: `paths-ignore` cobre `.claude/**`; smoke-test.yml diz "Triple Market"; download-artifact tem run-id.
8. Tech-debt reorganizado por severidade P0→P3.

---

## 8. Etapa: Criar `rules/multi-domain-rules.md`

**Codex thread:** `019e4175-83bd-7243-8fb9-cae956fbac27` (gpt-5.2, read-only).

**Achados aplicados (6):**
1. BLOCKER: §4/§9 — `check-content-parity.ts` valida 10 JSONs de `content/{locale}/pages/`, não blog. Reciprocidade hreflang é via `scripts/hreflang-validator.ts`.
2. BLOCKER: §12 — `generate-htaccess.ts` não tem `--check`; `check-content-parity.ts` não tem `--strict`. Removidos.
3. ERROR: §8 — estrutura real corrigida (`config/types.ts` canônico, `config/sites/types.ts` re-export, `getSiteConfig` vive em `src/lib/i18n.ts`).
4. ERROR: §7 — `build.yml` não usa Newsletter Worker URL; só `deploy.yml:492-495` faz.
5. ERROR: §1 — `it.ts` também hardcoda email (não só EN); `quality-gate.yml` usa `contacto@` vs `build.yml` `hola@` para ES.
6. WARN: §1 — `CAN-SPAM/CCPA` corrigido para `CAN-SPAM` (enum só aceita `LGPD | GDPR | CAN-SPAM`).

---

## 9. Etapa: Verificação do mecanismo de publicação automática

**Estado real do pipeline (verificado por `gh` em 2026-05-19 18:10 UTC):**

### 9.1. Cron registrado
```
.github/workflows/promote-from-stockpile.yml
  schedule:
    - cron: '0 13 * * *'   # 13h UTC diariamente
```
✅ Cron ativo.

### 9.2. Últimas execuções (sucesso)
```
gh run list --workflow=promote-from-stockpile.yml --limit=3
26112449473  promote-from-stockpile  success  workflow_dispatch  39s   2026-05-19T17:00:42Z
26111927869  promote-from-stockpile  success  workflow_dispatch  46s   2026-05-19T16:51:02Z
26111763623  promote-from-stockpile  success  workflow_dispatch  41s   2026-05-19T16:47:57Z
```
✅ Promote rodando com sucesso.

### 9.3. Chain build→deploy disparou
```
Quad Market Build  success  workflow_dispatch  4m52s   (run 26113715503)
Quad Market Deploy success  workflow_run       44m42s  (run 26113968516)
```
✅ Encadeamento bot push → build → deploy operacional.

### 9.4. Probe HTTP nos 4 domínios
Todos respondem 200 com `last-modified` de hoje (vide §5). ✅

### 9.5. Gaps detectados — status pos pair-codex (2026-05-19 19:30 UTC)

| Gap | Severidade | Status | Resolução |
|---|---|---|---|
| `.run-lock.json` tracked + sem `.gitignore` | P0 | **resolvido** | commit `719e499` — `git rm --cached` + entrada em `.gitignore` (lock + per-package locks). Mitigação `--autostash` permanece como camada extra. |
| 2 deploys cancelados (`cancel-in-progress: true`) | P2 | **resolvido** | commit `a8376d1` — `deploy.yml` agora `cancel-in-progress: false`. Deploys quad serializam (enfileiram). Trade-off documentado em `rules/auto-publishable-blog.md` §5. |
| `smoke-test.yml` legado com nome stale + `smoke-es` ausente | P2 | **resolvido** | commit `1f1edd4` — workflow removido. `post-deploy-smoke` em `deploy.yml:470` cobre os 4 domínios. `scripts/smoke-test.sh` mantido (helper consumido por `smoke-test-full.sh`). |
| Tech-debt: WhatsApp ES fallback hardcoded com número IT (`+393508751885`) | P2 | **resolvido** | commit `f3359ed` — fallback `''` em `config/sites/es.ts`; `buildWhatsAppUrl` retorna `''`; `WhatsAppStickyButton`/`ContactSection`/`SidebarCTA`/`StrategicAdvisorTeaser` gateiam render por `config.whatsapp` truthy; budget vira primary CTA no ES até secret `NEXT_PUBLIC_WHATSAPP_NUMBER_ES` ser setado. |
| ES Newsletter Worker secrets ausentes (`NEWSLETTER_WORKER_URL_ES`, `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES`) | P1 | **gap-spec gerado** (commit `f1da9bb`) | `docs/newsletter-worker-es-setup.md` traz playbook de 10 passos (~30 min Pedro): KV + D1 + pepper + Resend audience + wrangler secrets + deploy + healthcheck + GitHub secrets + rebuild. Build ES segue OK sem worker (`workerUrl == ''` tolerado em `config/sites/es.ts:64-72`). |
| Stockpile com 0 pacotes `available` (8 promoted via `index.json` regenerado) | P1 | **auditado** | Estado esperado pós-drain: `npx tsx scripts/regenerate-stockpile-index.ts` confirma 8 packages todos `promoted`. Supply upstream depende do slash command `/blog:stockpile-generate` (registrado em `systemForge` agent, não neste repo). Cron `0 13 * * *` UTC rodará no-op até refill. Não é regressão — é drain natural. |

**Conclusão da etapa 9 (atualizada):** mecanismo de publicação automática
**operacional** em produção. Os 4 domínios recebem deploys e respondem.
Dos 5 gaps originais + 1 tech-debt: **4 resolvidos** via commits diretos
(`.run-lock.json`, `cancel-in-progress`, `smoke-test.yml` legado, WhatsApp
ES), **1 documentado com playbook executável** (worker ES), **1 auditado
como comportamento esperado** (stockpile drain).

---

## Pair programming codex — thread 019e418c (2026-05-19)

Sessão `mcp__codex__codex` (gpt-5.2, sandbox read-only) confirmou:

1. **cancel-in-progress=false** é o caminho de menor risco para evitar
   SFTP em estado parcial (`group: deploy-${{ github.ref }}` mantido).
2. **`.run-lock.json` cleanup** é seguro: `--cached` não toca o arquivo
   em disco; processo do bot continua funcionando, lock recriado on-demand
   por `O_CREAT|O_EXCL` em `src/lib/blog/stockpile-locks.ts`.
3. **Deletar smoke-test.yml** sem perda funcional: já não dispara
   (escutava `"Triple Market Deploy"` inexistente) e não cobre ES.
4. **WhatsApp ES** com fallback vazio + guards é a opção (b) de UX
   (não mostra CTA errado, mantém budget como canal primário, reversível
   com 1 secret).

---

## Pendências restantes (não-blocking; aguardam ação humana ou supply)

1. **Pedro: deploy do Newsletter Worker ES** seguindo
   `docs/newsletter-worker-es-setup.md` (10 passos, ~30 min). Setar
   `NEWSLETTER_WORKER_URL_ES` + `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_ES`
   ao final.
2. **Stockpile refill:** rodar `/blog:stockpile-generate` no agente
   systemForge para repor packages drenados (cron `0 13 * * *` UTC
   consumirá quando houver `available` > 0).
3. **Pedro (opcional):** setar `NEXT_PUBLIC_WHATSAPP_NUMBER_ES` quando
   houver linha ES dedicada — UI volta a renderizar WhatsApp em ES sem
   refactor extra.
4. **Tech-debt P3 — resolvido** (commits `f3b56bc`, `7e18b4e`):
   - `config/sites/{en,it}.ts:20` agora respeitam `process.env.NEXT_PUBLIC_CONTACT_EMAIL` com fallback hardcoded (mesmo pattern de BR/ES). CI continua injetando per-locale via `build.yml` matrix.
   - Prosa stale "3 locales" / "Triple Market" reescrita em 10 arquivos (BUILD.md, ROBOTS-I18N-AUDIT.md, src/types/hreflang.types.ts, scripts/check-content-parity.ts, scripts/validate-hreflang-pages.ts, docs/{search-console-setup,ci-cd-secrets,hreflang-rules,INTEGRATION-AUDIT}.md, .github/workflows/deploy.yml). Lógica já cobria 4 locales; apenas comentários estavam desatualizados.
   - Não tocado (deliberado): `rules/{multi-domain,commit-multilanguage,auto-publishable-blog}.md` (documentam o gap como histórico de backlog); `scripts/smoke-stockpile-generate.ts:183` (literal de cenário downgrade test).

---

Ver `commit-multilanguage.md`, `auto-publishable-blog.md` e
`multi-domain-rules.md` para os contratos detalhados que estas etapas
implementam.
