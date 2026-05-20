# commit-multilanguage — Regras canônicas para commits do blog quad-market

Última revisão: 2026-05-19 (pós-incidente promote-from-stockpile)

Este documento descreve o contrato de commit para qualquer mudança que toque
`content/{locale}/blog/`, `.claude/blog/data/` ou os scripts/workflows que
sustentam a publicação multidomínio. Quem altera essas áreas — agente Claude,
routine `blog-daily`, cron `promote-from-stockpile` ou humano — segue as regras
abaixo. Saída do contrato = build/deploy quad-market pode quebrar
silenciosamente.

## 1. Sempre em `main` (Trunk-Based)

- Todo commit vai direto para `main`. **Nunca** `git checkout -b`, `git switch -c`
  ou abertura de feature branch a partir de pipeline (routine, cron, agente).
  Múltiplas pipelines (DCP, daily-loop, blog, mkt) rodam no mesmo worktree;
  trocar de branch fode o contexto de todas.
- Rollback: `git revert <sha>` apenas. Nunca branch nova, nunca `git reset --hard`
  em remote shared.
- Exceções legítimas (não violam a regra), só com gate humano:
  - `deploy_branch` em scripts de deploy (alvo, não branch de trabalho).
  - Hotfix de rollback: requer (a) issue aberta documentando o incidente,
    (b) autorização explícita do operador humano em comentário, (c) revert
    obrigatório se o hotfix falhar no smoke-test pós-deploy, (d) merge de volta
    em `main` no mesmo dia.
  - Contribuidor externo via fork em projeto open-source do usuário (não do
    agente).

## 2. Formato canônico da mensagem

Três famílias permitidas. O prefixo `content(multilanguage):` é literal e é o
gatilho que `promote-from-stockpile.yml` usa para decidir se dispara o build
após o push do bot (`git log -1 --format=%s | grep -q "^content(multilanguage): promote daily batch"`).
Renomear o prefixo silenciosamente desconecta o pipeline.

| Origem | Formato | Exemplo |
|---|---|---|
| Routine `blog-daily` (humano-supervisionado) | `content(multilanguage): add N articles — daily batch YYYY-MM-DD` | `content(multilanguage): add 4 articles — daily batch 2026-05-11` |
| Cron `promote-from-stockpile` (bot) | `content(multilanguage): promote daily batch (pt-BR=N it-IT=N en=N es-ES=N)` | `content(multilanguage): promote daily batch (pt-BR=3 it-IT=0 en=0 es-ES=0)` |
| Trabalho cross-locale manual | `content(multilanguage): close <topic> cross-locale — batch YYYY-MM-DD` | `content(multilanguage): close power-bi cross-locale — batch 2026-04-23` |

Regras gerais:
- Subject ≤ 100 caracteres.
- Sempre em pt-BR. Não usar travessão `—` longo dentro de tokens parseáveis pelo
  grep (o exemplo acima usa `—` apenas como separador legível; o gate do
  promote testa **somente** o prefixo até `promote daily batch`).
- Quando o commit acrescenta E ajusta artigos antigos, manter `add N` na
  contagem dos novos e descrever ajustes no corpo. Não inflar `N`.
- Para a routine `blog-daily`, `N` ∈ [0..4] (1 por locale, cap declarado em
  `AGENTS.md:29`). Para o cron `promote-from-stockpile`, `MAX_PER_LOCALE=3`
  (declarado em `scripts/promote-from-stockpile.ts`); o total varia conforme
  pacotes elegíveis.

## 3. Escopo permitido por origem

Pré-condição inviolável: **publicação automática só toca arquivos de conteúdo**.
Mistura de conteúdo + código no mesmo commit do bot é causa raiz de regressão
quad-market.

### 3.1. Cron `promote-from-stockpile` (bot)
- Permitido escrever: `content/{locale}/blog/{slug}.mdx` (criação com flag `wx`)
  e `.claude/blog/data/stockpile/packages/{uuid}/package.json` (atualização de
  `promotion_state` e `lifecycle.promoted_at`).
- Pathspecs explícitos em `git add`: nunca `git add -A` ou `git add .`.
- `.run-lock.json` em `.claude/blog/data/stockpile/` é tracked: o `pull --rebase`
  exige `--autostash` (já patch-aplicado em `scripts/promote-from-stockpile.ts`).

### 3.2. Routine `blog-daily` (Claude Code agendado)
- Permitido: novos `.mdx` em `content/{locale}/blog/` + atualizar
  `.claude/blog/data/*.json` (keywords, hreflang map, parity).
- Proibido (regra do AGENTS.md): `src/`, `config/`, `package.json`,
  `next.config.*`, qualquer código. Não altera artigo já publicado, só cria
  novos. Máx 4 artigos por run (1 por locale), 200k tokens/run. Em falha, abre
  issue `routine-failure` no `Pedrocorgnati/systemForge` e nada é commitado.

### 3.3. Manual (humano ou agente sob direção humana)
- Pode tocar código E conteúdo, mas separe em commits distintos quando
  possível. Commits que misturam scripts + content do bot encarecem `git revert`
  cirúrgico.
- Use prefixos diferentes para mudanças de código: `fix(blog-promote): ...`,
  `feat(blog): ...`, `chore(workflows): ...`. Não use `content(multilanguage):`
  para mudanças que não criam/promovem artigos — isso confunde o grep do
  promote.

## 4. Author/committer identity

| Quem commita | `user.name` | `user.email` |
|---|---|---|
| `scripts/promote-from-stockpile.ts` (commit + push) | `github-actions[bot]` | `41898282+github-actions[bot]@users.noreply.github.com` |
| Step `Push (se houve commit)` em `promote-from-stockpile.yml` (fallback) | `promote-from-stockpile bot` | `actions@github.com` |
| Routine `blog-daily` | conforme configurado em `claude.ai/code/routines` | idem |
| Humano | nome real (Pedro Corgnati) | email pessoal |

**Estado conhecido (tech-debt P1)**: o script TS e o step shell do workflow
usam identidades diferentes (`github-actions[bot]` vs `promote-from-stockpile bot`).
O step shell ainda existe como fallback, mas o script já faz o push completo
(`git pull --rebase --autostash` + `git push`), então o `git push origin main`
do workflow vira no-op… **exceto** quando mascara falha real: o step usa
`git push origin main || echo "no commit (no-op)"`
(`.github/workflows/promote-from-stockpile.yml:42`) — qualquer erro de auth,
rebase ou non-fast-forward vira "no-op" silencioso no log. O step seguinte
(`Dispatch Quad Market Build`) dispara mesmo assim porque lê `git log -1`
**local**, não o remoto. Convergir é mandatório:
- (a) **Preferível**: remover o step shell (o script já faz tudo).
- (b) **Mitigação interina**: trocar `|| echo` por `|| { git status; exit 1; }`
  para que falha real apareça no run vermelho.
- (c) **Hardening**: gate de dispatch por `git ls-remote origin main` (SHA
  remoto) em vez de `git log -1` local. Detalhes em `auto-publishable-blog.md`
  §3.2 e §10.

**Por que importa identificar-se como `github-actions[bot]`**: a regra do
GitHub Actions sobre `GITHUB_TOKEN` não trigar workflows secundários depende
do **token usado no push** (é o `GITHUB_TOKEN` do `actions/checkout`), não do
author do commit. Mas identificar como bot é necessário para auditoria humana
no GitHub UI e para o grep do dispatch em §3.2 do `auto-publishable-blog.md`
distinguir bot push de humano push em logs/notificações.

## 5. Paths-ignore e o que dispara o build

`build.yml` ignora pushes que só tocam: `docs/**`, `*.md` (raiz), `.agents/**`,
`.claude/**`, `CHANGELOG*`. Implicações operacionais:

- Um commit do bot promote que escreve **só** `.mdx` em `content/{locale}/blog/`
  dispara o build (content/ não está em paths-ignore).
- Mas a atualização de `package.json` do stockpile dentro de `.claude/blog/data/`
  está em paths-ignore. Portanto **se o commit do bot tivesse só** atualizações
  dentro de `.claude/blog/` (sem `.mdx`), o build **não** dispararia. Isso é
  cinto-e-suspensório: o promote sempre acompanha `.mdx` novos.
- Mudanças em `scripts/`, `.github/workflows/`, `src/`, `config/`, `velite.config.ts`
  disparam o build. Quem altera o pipeline assume custo de 4 builds + 4 deploys.

## 6. Quality Gate (push em `main`)

Toda push em `main` (humano, routine ou bot) também aciona
`.github/workflows/quality-gate.yml` (job `quality`), que falha se:
- `tsc --noEmit` falhar em qualquer um dos 4 locales (pt-BR, it-IT, en, es-ES).
- ESLint `src/ --ext .ts,.tsx --max-warnings 30` ultrapassar 30 warnings.
- `scripts/check-content-parity.ts` detectar divergência de paridade. **Escopo
  real do script:** valida existência de **10 JSONs de `content/{locale}/pages/`
  × 4 locales (= 40 arquivos)** + paridade de IDs em `portfolio.json` e
  `services.json`. Não toca blog MDX nem `hreflang_pair`. (Logs internos do
  script ainda dizem "10 × 3 locales / 30 arquivos" — mensagem desatualizada
  desde a inclusão de es-ES; tech-debt P2.)
- `scripts/validate-frontmatter.ts` falhar em qualquer locale.
- Reciprocidade de `hreflang_pair` entre artigos é validada por
  `scripts/hreflang-validator.ts` (não pelo `check-content-parity.ts`).

Origem normativa do `excerpt`: `src/lib/blog/post-schema.ts`
(`PostFrontmatterSchema`), Zod min 50 / max 300. **Velite NÃO importa este
schema** — `velite.config.ts:130-156` declara um sub-schema inline que espelha
parcialmente as restrições (apenas `s.string().max(300)`, sem `min(50)`).
Quem aplica o Zod canônico em tempo de commit/CI é
`scripts/validate-frontmatter.ts` e `scripts/promote-from-stockpile.ts:111`.
Drift entre o Zod canônico e o espelho do Velite é tech-debt P2.

Se o `description` de um pacote stockpile passar de 300 chars (mínimo de 50 é
atendido pelo gerador), o promote **skipa** aquele pacote (não trunca) e loga
`[promote] skip <equivalence_id>/<locale>: <issues>` — prefere-se sub-publicar
a corromper SEO.

## 7. Push: regras de concorrência

- Sempre `git pull --rebase --autostash origin main` antes do `git push origin main`.
  Promote bot e routine podem aterrissar entre `git commit` e `git push` (window
  de minutos), causando non-fast-forward.
- **Nunca** `git push --force` em `main`. Se rebase quebrar, abortar, abrir issue
  manual e revert.
- **Nunca** `--no-verify` no commit. **Este repo não versiona hooks** — o
  gate canônico é `quality-gate.yml` no CI, mais hooks locais quando o operador
  os instala (`.git/hooks/pre-commit`, fora do índice). Pular validação local
  empurra a falha pro CI: o build vai quebrar 4× em paralelo e o promote bot
  pode chegar ao push antes de você notar. (Em outros repos do mesmo workspace
  pode haver `atomic-verifier` ou similar — não tem efeito aqui; nada bloqueia
  secret inline em tempo de commit neste worktree).

## 8. Anti-padrões bloqueantes (auto-reject)

| Sintoma | O que está errado | Como corrigir |
|---|---|---|
| Bot push usando `git add -A` | Risco de levar `.env`, lock files spurious, builds residuais | Sempre pathspecs explícitos. Use o helper em `scripts/promote-from-stockpile.ts` como referência. |
| Mensagem `content: ...` (sem `(multilanguage)`) | Grep do promote-from-stockpile.yml não casa, build não dispara | Use o prefixo literal `content(multilanguage):`. |
| Commit do bot com `.mdx` E mudança em `src/` | Mistura conteúdo (paths-ignore=false) com código (paths-ignore=false) — vira changeset auditavelmente confuso e quebra contract da routine | Faça commits separados. Se urgente, prefira humano commitar e marcar review. |
| Commit em branch `feat/*`, `chore/*` no meio da rotina | Rompe Trunk-Based, fode outras pipelines paralelas no worktree | Sempre `main`. Revert se necessário. |
| `--no-verify`, `--force`, `--amend` em commit já pushed | Bypass de hooks de segurança e reescrita de histórico shared | Recomece com novo commit. |
| Frontmatter sem `excerpt` (só `description`) | Velite + PostFrontmatterSchema (Zod) rejeitam, build quebra | O splice de `description → excerpt` está no promote. Se gerou MDX manualmente, copie a description também para excerpt. |

## 9. Quando a regra falha — diagnóstico rápido

- Promote rodou cron success mas não criou artigos: provavelmente schema mismatch
  (excerpt). Check `gh run view <id> --log | grep "skip "`.
- Bot push funcionou mas Build não rodou: o commit é do `GITHUB_TOKEN`; o
  workflow `promote-from-stockpile.yml` deveria ter um step
  `gh workflow run build.yml` após o push. Validar `permissions: actions: write`.
- Build dispatched mas Deploy não acionou: workflow_run não dispara em
  workflow_dispatch via token. `build.yml` deve ter o job `dispatch-deploy`
  passando `build_run_id`. Validar `deploy.yml` aceita `inputs.build_run_id` e
  todos os `actions/download-artifact@v4` usam o fallback
  `${{ github.event.workflow_run.id || inputs.build_run_id }}`.
- Push falhou non-fast-forward: outro bot promote rodou. `git pull --rebase --autostash`
  e repush.

## 10. Como validar localmente (checklist auto-suficiente)

Comandos prontos para um agente novo confirmar que entendeu o contrato:

```bash
# 10.1. Dry-run do promote (não commita, não escreve, não pusha)
DRY_RUN=1 npx tsx scripts/promote-from-stockpile.ts

# 10.2. Confirmar que o grep dispatch ainda case com o prefixo canônico
grep -E '^[[:space:]]+if git log -1 --format=%s' .github/workflows/promote-from-stockpile.yml

# 10.3. Auditar últimos 30 commits para drift do prefixo
git log -30 --oneline --grep='content(multilanguage):'

# 10.4. Conferir que actions: write está no promote workflow
grep -A2 '^permissions:' .github/workflows/promote-from-stockpile.yml

# 10.5. Confirmar quality-gate.yml ativo e rodando em push em main
gh run list --workflow=quality-gate.yml --branch=main --limit=5

# 10.6. Validar schema Zod do frontmatter para 1 locale
NEXT_PUBLIC_LOCALE=pt-BR npx tsx scripts/validate-frontmatter.ts

# 10.7. Confirmar paridade cross-locale (10 pages × 4 locales = 40 checks)
# Atenção: o script ainda loga "30 / 3 locales" (mensagem stale); o que importa
# é exit 0 + nenhum "MISSING:" no output.
npx tsx scripts/check-content-parity.ts

# 10.8. Validar reciprocidade hreflang dos artigos de blog (separado da 10.7)
npx tsx scripts/hreflang-validator.ts
```

Se 10.2 retornar vazio ou diferente do prefixo `^content(multilanguage): promote daily batch`,
o pipeline está quebrado em silencio. Se 10.4 não mostrar `actions: write`, o
dispatch do build (vide `auto-publishable-blog.md` §3.2) não funciona.

Ver `auto-publishable-blog.md` para o pipeline ponta-a-ponta e
`multi-domain-rules.md` para as invariantes quad-market.
