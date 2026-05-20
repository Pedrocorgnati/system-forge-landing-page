# Blog Auto-Publish Fix — PROGRESS

Criado: 2026-05-19
Owner: agente
Branch: main (Trunk-Based)

## Contexto

Os 4 domínios do quad-market (forjadesistemas.com.br, systemforge.it, systemforgesoftware.com, systemforge.es) estão congelados no deploy de **2026-05-15 23:00 UTC**.

Hreflang reciprocidade está intacta — o que quebrou foi a **publicação automática**.

### Causa-raiz (confirmada)

- Workflow `promote-from-stockpile` (cron `0 13 * * *`) roda diariamente e completa "success", mas é no-op.
- Todos os pacotes do stockpile são rejeitados com `schema invalido (Required)`.
- Mismatch de contrato:
  - `src/lib/blog/post-schema.ts` exige `excerpt` (z.string min 50 / max 300)
  - `velite.config.ts:156` também exige `excerpt`
  - Pacotes do stockpile emitem só `description`, nunca `excerpt`
- Os 3 pacotes hoje em `promotion_state=promoted` (`2c0305d9`, `7812ee02`, `c3d26dea`) foram promovidos manualmente (têm `excerpt` no MDX final mas não no `reviewed.md` original).
- Como `content/**` não muda há ~4 dias, `Quad Market Build` + `Deploy` não disparam (push-trigger só em `paths-ignore` que exclui `.claude/**`).

## Plano de correção (4 etapas)

### Etapa 1 — Patch surgical em `scripts/promote-from-stockpile.ts`

- [x] Pre-flight: ler script completo (152 linhas)
- [x] Controversial check: 7 riscos enumerados (matter.stringify reformata YAML, truncar quebra SEO, etc)
- [x] Hardening: codex MCP review (4 blockers + 5 nice-to-fix). Aplicados:
  - DRY_RUN gate em mkdirSync, fs.writeFileSync .mdx, fs.writeFileSync package.json, git config/add/commit/push
  - `git add` com pathspecs explícitos (não `-A`)
  - Removido `matter.stringify`; usa regex splice `excerpt:` após `description:` (preserva YAML original)
  - Não trunca silenciosamente — falha validação se >300 (verificado: descriptions atuais têm 130-160 chars, bem abaixo do limite)
  - Log de TODAS as issues do Zod (até 5, com `path -> message`)
  - `fs.writeFileSync` com `flag: 'wx'` (exclusive create, defense-in-depth contra TOCTOU)
- [x] Aplicar patch (3 edits: const DRY_RUN, inner loop, mutation+git block)
- [x] Type-check: tsc --noEmit limpo, zero erros
- [x] Marcar concluído

**Follow-ups recomendados pelo codex, postergados (não bloqueantes para fix imediato):**
- Partial package promotion (track per-locale state) — academic com stockpile atual (single-locale)
- MAX_PER_LOCALE policy alinhamento com routine docs — fora de escopo
- `execFileSync` vs `execSync` — cosmético
- Fix upstream no gerador do stockpile para emitir `excerpt` direto — separação de concerns adequada, fora do fix de emergência

### Etapa 2 — Smoke test local

- [x] Pre-flight: DRY_RUN gate aplicado em Etapa 1
- [x] Controversial check: 4 riscos enumerados (mkdir antes do gate, .run-lock orfão, etc — todos OK no patch)
- [x] Hardening: codex MCP review (rejeitou plan original — temp-copy era arriscado, step 4 mutaria produção, regex pode quebrar com YAML block-folded). Aplicado:
  - Removido plan de "rodar sem DRY_RUN com CONTENT_DIR=/tmp" (mutaria stockpile)
  - Confirmado: descriptions são single-line quoted (regex segura para o stockpile atual)
  - Adicionada verificação isolada do splice via `npx tsx -e`
- [x] Rodar DRY_RUN smoke: passou — 1 pacote pt-BR aceito com `excerpt_injected=true, bytes=15693`
- [x] Rodar isolated splice unit-check: passou — splice changed=true; re-parse OK; schema OK em ambas passadas (pre-splice via injected, pós-splice via re-parse)
- [x] Pré-SHA == Pós-SHA (353b664), nenhum commit criado, nada mutado em disco pelo smoke
- [x] Validado: frontmatter resultante tem `description` E `excerpt` (paridade com pattern dos artigos já publicados em content/pt-BR/blog/)
- [x] Marcar concluído

### Etapa 3 — Commit + push

- [x] Pre-flight: working tree tem changes não-relacionadas da Fase 2 mas commit é seletivo (só 2 files)
- [x] Controversial check: o commit toca `scripts/promote-from-stockpile.ts` — não está em `paths-ignore` do `build.yml`, portanto vai disparar `Quad Market Build` no push. Build esperado para passar (não muda content/MDX, apenas script TS standalone). Não dispara `promote-from-stockpile` (workflow é `schedule + workflow_dispatch`, NÃO push-triggered)
- [x] Hardening: codex MCP review confirmou — push é seguro, promote-from-stockpile precisa ser triggado manualmente via `gh workflow run`
- [x] `git add scripts/promote-from-stockpile.ts BLOG-PROMOTE-FIX-PROGRESS.md`
- [x] `git commit -m "fix(blog-promote): map description -> excerpt to unblock auto-publish"` → SHA `a6254da`
- [x] `git push origin main` → `353b664..a6254da  main -> main` OK
- [x] Marcar concluído

### Etapa 4 — Verificação online: mecanismo de publicação automática implantado

- [ ] Pre-flight: listar todos os workflows que compõem o pipeline (`promote-from-stockpile`, `build`, `deploy`)
- [ ] Controversial check: o que pode falhar entre commit -> produção?
- [ ] Hardening: review independente via codex MCP
- [ ] Verificar workflow `promote-from-stockpile.yml` ativo (gh workflow list)
- [ ] Verificar último cron rodou (gh run list)
- [ ] Triggar manualmente via `gh workflow run promote-from-stockpile` para validar fix sem esperar 13h UTC do dia seguinte
- [ ] Aguardar conclusão; ler logs; confirmar pelo menos 1 promoção bem-sucedida
- [ ] Aguardar `Quad Market Build` + `Quad Market Deploy` (auto-disparados pelo commit do bot em content/)
- [ ] Probe HTTP nos 4 domínios: confirmar `last-modified` atualizado para data >= 2026-05-19
- [ ] Probe 1 artigo novo em pelo menos 1 domínio (HTTP 200, conteúdo MDX renderizado, hreflang correto)
- [ ] Marcar concluído

## Critério de Aceite Final

1. Patch mergeado em `main`
2. Workflow `promote-from-stockpile` triggou manualmente, executou validação, promoveu pelo menos 1 pacote, commitou em `main`
3. `Quad Market Build` rodou matrix 4-locale com success
4. `Quad Market Deploy` rodou matrix 4-locale com success
5. Pelo menos 1 dos 4 domínios tem `last-modified` > 2026-05-19
6. PROGRESS.md atualizado com todas as etapas marcadas concluído

## Decisões fora de escopo (NÃO mexer agora)

- Patch upstream no gerador do stockpile (lugar onde `description` é escrito) — fora de escopo até confirmarmos o fix surgical funciona em produção
- Refactor de `paths-ignore` em `build.yml` — deixar como está; commits do bot tocam `content/**` e isso já dispara o build
- Promover manualmente os 5 pacotes `available` antes do fix — esperar o bot fazer isso no próximo trigger

## Log de execução

| Timestamp | Etapa | Ação | Resultado |
|-----------|-------|------|-----------|
| 2026-05-19 | inicial | PROGRESS.md criado | OK |
