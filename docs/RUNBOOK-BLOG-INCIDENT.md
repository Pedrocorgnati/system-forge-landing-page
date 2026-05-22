# Runbook de Incidente — Pipeline de Blog (Stockpile / Promote / Deploy)

> Origem: tasklist `05-21-auto-blog` T015 (ESTUDO §4 D6, §5.8). Decisao D9
> (dono de resposta) registrada no `DECISION-LOG.md` da tasklist.
> Este runbook cobre os incidentes do CAMINHO B do blog: geracao de estoque
> (stockpile) -> promocao (`promote-from-stockpile.yml`) -> deploy (SFTP).

## 0. Escopo e arquitetura (contexto rapido)

Ha dois caminhos independentes que publicam em `content/{locale}/blog/`:

- **Caminho A — routine `blog-daily`:** escreve `.mdx` direto em `content/`.
  Volume continuo automatizado. NAO usa o stockpile. Fora do escopo deste
  runbook (incidentes da routine abrem issue `routine-failure`, ver `AGENTS.md`).
- **Caminho B — stockpile -> promote -> deploy:** este runbook. Botao
  `blog stockpile` (workflow-app, repo `systemForge`) gera 1 pacote no buffer
  `.claude/blog/data/stockpile/`; o cron `promote-from-stockpile.yml` (13h UTC)
  drena o buffer para `content/`; `build.yml` -> `deploy.yml` publicam por SFTP.

Locales: pt-BR, it-IT, en, es-ES. Dominios: `forjadesistemas.com.br` (br),
`systemforge.it` (it), `systemforgesoftware.com` (en), `systemforge.es` (es).

## 1. Comandos de diagnostico

Rodar do root do repo `system-forge-landing-page`, na ordem:

```bash
# 1. Orfaos no estoque (diretorio de pacote sem package.json) — fonte de
#    verdade em disco. index.json NAO e confiavel (ESTUDO §2.1).
for d in .claude/blog/data/stockpile/packages/*/; do
  [ -f "$d/package.json" ] || echo "ORFAO: $d"
done

# 2. Elegibilidade real do promotor (dry-run, nao publica, nao faz push).
DRY_RUN=1 npx tsx scripts/promote-from-stockpile.ts
#    Ler a saida agregada de T011:
#      [PROMOTE] Resumo: N elegiveis de M diretorios | K artigos promovidos
#      [PROMOTE] Skips (pacote): missing_package_json=.. already_promoted=.. ...
#      [PROMOTE] Skips (locale): schema_invalid=.. mdx_compile_error=.. ...
#    A causa de "zero elegiveis" sai nessas 3 linhas em <10s.

# 3. Ultimos commits de stockpile/promote.
git log --oneline -10

# 4. Status do workflow de promote (precisa de gh autenticado).
gh run list --workflow=promote-from-stockpile.yml --limit 10

# 5. Issues operacionais abertas.
gh issue list --label promote-noop --state open
gh issue list --label promote-failure --state open
```

Sinais ricos adicionais (mesmo run de CI):

- `.claude/blog/data/stockpile/metrics/promote-*.json` — snapshot
  `blog-metrics/v1` do ultimo run (efemero, gitignored). Campos-chave:
  `stage_health`, `pipeline_health`, `discard_reasons`, `packages_orphan`.
- Anotacao `::error title=Stockpile orfao::` na pagina do run do GitHub Actions
  — aparece mesmo com run verde quando ha orfao (T011).

## 2. Criterios de severidade

| Sev | Condicao | Significado |
|-----|----------|-------------|
| **SEV-1 critico** | Nenhum pacote `available` por > 48h **e** nenhum orfao | Falha upstream completa da geracao de estoque |
| **SEV-2 alta** | Nenhum pacote `available` por > 24h **com** orfaos presentes | Bug estrutural ativo no gerador de estoque |
| **SEV-3 media** | Promote em no-op por 1-2 dias **com** pacotes `available` presentes | Possivel falha no promotor (pacotes existem mas nao promovem) |
| **SEV-4 baixa** | Alerta de observabilidade disparou, mas a publicacao ocorre normal | Falso positivo ou degradacao leve |

Notas de leitura:

- O alerta automatico `promote-noop` (issue, T010) dispara apos **3 dias** sem
  commit de promote. Ele e SEV-3/SEV-4 por padrao; escalar para SEV-1/SEV-2
  conforme a tabela apos diagnostico.
- Caminho A (`blog-daily`) seguir publicando NAO rebaixa a severidade do
  Caminho B: sao canais distintos. Mas reduz o impacto de negocio (ha conteudo
  saindo por outra via) — registrar isso na triagem.

### 2.1 Lacuna de detectabilidade (IMPORTANTE)

Os limiares de severidade desta tabela (24h, 48h, 1-2 dias) sao **menores que a
janela do alerta automatico** `promote-noop`, que so dispara apos **3 dias**
(limiar D4, escolhido deliberadamente para ser imune a ruido de
`workflow_dispatch` e cron suprimido — NAO reduzir sem reabrir D4). Consequencia:
um SEV-1 (48h) ou SEV-3 (1-2 dias) **nao e pego pelo alerta automatico** dentro
do proprio limiar de severidade; so por inspecao manual.

**Mitigacao operacional obrigatoria ate o early-warning existir:** o dono (D9)
faz uma **checagem manual diaria** do estado do Caminho B — diagnostico passos
1 e 2 da secao 1 (orfaos + as 3 linhas `[PROMOTE]` do dry-run). E uma olhada de
<1 min. Sem ela, os limiares de 24-48h sao apenas nominais.

**Correcao definitiva (follow-up, herdado de D2):** um alerta de estoque baixo
`packages_available < N` (early-warning), que dispara ANTES da janela de 3 dias.
Quando esse alerta existir, a checagem manual diaria pode ser aposentada.

## 3. Dono de resposta (D9)

**Dono:** o dono do pipeline de blog. Hoje a operacao e de um unico operador
(o mantenedor do repo) — nao ha rotacao de on-call. O dono e responsavel por:
triagem do alerta, execucao deste runbook, decisao de rollback e fechamento da
issue (`promote-noop` / `promote-failure`).

Se a operacao crescer para mais de uma pessoa, substituir por uma escala de
on-call e atualizar D9 no `DECISION-LOG.md` da tasklist.

## 4. Procedimento por incidente

### 4.1 `available = 0` (estoque vazio)

1. Diagnostico passos 1-2. Se a saida do dry-run for `0 elegiveis` com
   `Skips (pacote): already_promoted=N` alto -> nao e incidente: o estoque foi
   todo promovido normalmente. Repor estoque (secao 4.4).
2. Se houver orfaos -> tratar como secao 4.2 primeiro.
3. Se ha pacotes mas todos com `promotion_state != available` ou
   `freshness_expired` -> investigar o gerador / a politica de frescor.
4. Repor estoque: clicar o botao `blog stockpile` no workflow-app (repo
   `systemForge`) ou rodar `/blog:stockpile-generate` + `/blog:stockpile-push`.

### 4.2 Pacote orfao (diretorio sem `package.json`)

1. Diagnostico passo 1 lista os UUIDs orfaos.
2. O `stockpile-push` ja aborta com **exit 16** quando detecta orfao (guard
   T003) — o orfao nao chega a ser commitado. O promotor mantem `exit 0` mas
   marca `stage_health=broken` e emite a anotacao `::error::` (T011).
3. Decidir por orfao:
   - **Reconstruir** o `package.json` se o conteudo (`reviewed.md` por locale)
     for valido — ver o procedimento de T005 (reconstrucao schema-valida com
     marcador `_provenance`).
   - **Quarentena** se o conteudo for suspeito/duplicado — secao 4.5.
4. Causa-raiz e upstream no gerador de estoque (T002/T003). Se orfaos
   reaparecem, abrir issue no gerador, nao so limpar o sintoma.

### 4.3 Promote em no-op (workflow verde, nada publicado)

1. O alerta automatico abre/comenta a issue `promote-noop` apos 3 dias (T010).
2. Diagnostico passos 1-2. As 3 linhas `[PROMOTE]` do dry-run dizem a causa:
   - `already_promoted` alto + `available=0` -> estoque seco. Secao 4.1/4.4.
   - `missing_package_json > 0` -> orfao. Secao 4.2.
   - `schema_invalid` / `mdx_compile_error` / `slug_collision` /
     `frontmatter_invalid` altos -> pacotes existem mas o conteudo nao passa.
     Investigar o pacote especifico; quarentena se corrompido.
3. A issue `promote-noop` fecha sozinha quando um promote volta a acontecer.

### 4.4 Reposicao de estoque

- Acionar o botao `blog stockpile` no workflow-app (1 clique = 1 pacote
  quad-locale; ver D2). Repetir conforme o volume desejado.
- Lembrete: alterar o template do botao exige **reiniciar o workflow-app**
  (templates sao modulo Python carregado no startup — ver T012/T002, H5).

### 4.5 Procedimento de quarentena

1. Mover o diretorio suspeito: `git mv .claude/blog/data/stockpile/packages/{uuid} .claude/blog/data/stockpile/quarantine/{uuid}`.
2. Registrar o motivo em `.claude/blog/data/stockpile/quarantine/QUARANTINE-LOG.md`
   (UUID, data, motivo, decisao).
3. **NAO deletar conteudo sem aprovacao** do dono (D9).

### 4.6 Procedimento de rollback (alinhado a D6 do ESTUDO)

1. Identificar o commit de promote a reverter:
   `git log --oneline --grep="content(multilanguage): promote daily batch"`.
2. Reverter: `git revert <sha-promote>`. **Nunca via branch nova** — regra
   Trunk-Based / Always Main. O revert vai direto em `main`.
3. Disparar rebuild + redeploy: `git push` aciona `build.yml` -> `deploy.yml`,
   ou rodar `gh workflow run build.yml --ref main` / `deploy.yml` via
   `workflow_dispatch`.
4. **CDN / cache:** ate a ultima verificacao (T015), nenhum workflow em
   `.github/workflows/` usa Cloudflare ou CDN com passo de purge — o deploy e
   SFTP direto para o `public_html` de hospedagem compartilhada (4 dominios,
   ver `deploy.yml`). **Nao ha passo de purge conhecido.** Condicao verificavel:
   se, apos o redeploy concluir verde, o conteudo revertido NAO refletir em
   producao, antes de escalar verificar nesta ordem — (a) hard-refresh / aba
   anonima (cache do browser); (b) cache server-side da hospedagem
   (`.htaccess` / LiteSpeed LSCache — checar se ha regra de cache de pagina);
   (c) so entao suspeitar de uma camada de CDN nao documentada e reabrir esta
   secao. O redeploy sobrescreve os arquivos no `public_html`; se o arquivo no
   servidor ja esta correto e producao ainda mostra o velho, o problema e
   cache, nao deploy. (A hipotese "Cloudflare purge" do ESTUDO D6 nao se aplica
   enquanto a condicao acima nao for observada.)

### 4.7 Verificacao por estagio (pos-promocao ate producao)

O `promote-from-stockpile.yml` rodar verde so confirma o **primeiro** estagio. A
cadeia completa tem 5 estagios e cada um pode falhar de forma silenciosa para os
demais. Sintoma classico que cai aqui: "o promote commitou, mas o artigo nao
aparece no dominio X". Percorrer os estagios na ordem e parar no primeiro que
falhar.

| # | Estagio | Como verificar OK | Falha tipica |
|---|---------|-------------------|--------------|
| 1 | **Promote** | `gh run list --workflow=promote-from-stockpile.yml --limit 1` verde; metrics `stage_health=healthy` | no-op / orfao — secao 4.2/4.3 |
| 2 | **Commit** | `git log --oneline --grep="content(multilanguage): promote daily batch" -1` mostra SHA recente; bate com `promotion_commit_sha` do metrics | promote verde mas sem commit (0 elegiveis) |
| 3 | **Build** | `gh run list --workflow=build.yml --limit 1` verde para o SHA do estagio 2 | build verde mas **deploy nao disparado** (ver abaixo) |
| 4 | **Deploy SFTP por dominio** | `gh run list --workflow=deploy.yml --limit 1` verde; **conferir nos 4 dominios** | deploy parcial: 1 de 4 dominios falhou e o run pode ainda sair verde |
| 5 | **HTTP em producao por dominio** | `curl -sI https://{dominio}/blog/{slug}` -> `200`; abrir a URL | publicado no servidor mas cache servindo velho — secao 4.6 passo 4 |

Verificacao HTTP dos 4 dominios (estagio 5), trocar `{slug}` pelo slug do artigo:

```bash
for u in \
  "https://forjadesistemas.com.br/blog/{slug-pt}" \
  "https://systemforge.it/blog/{slug-it}" \
  "https://systemforgesoftware.com/blog/{slug-en}" \
  "https://systemforge.es/blog/{slug-es}"; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "$u")  $u"
done
```

Modos de falha que NAO aparecem como run vermelho — checar explicitamente:

- **Deploy SFTP parcial (1 de 4 dominios).** Cada dominio tem credenciais SFTP
  proprias; uma credencial expirada/errada derruba so aquele dominio. Se o job
  de deploy itera dominios sem `fail-fast`, o run pode terminar verde com 1
  dominio desatualizado. Sintoma: estagio 5 da `200` em 3 dominios e conteudo
  velho (ou `404`) em 1. Acao: reexecutar `deploy.yml` via `workflow_dispatch`;
  se persistir so naquele dominio, suspeitar de **secret SFTP expirado** —
  validar host/usuario/senha do dominio afetado nos secrets do repo e rotacionar.
- **Build verde mas deploy nao disparado.** Se `deploy.yml` depende de
  `workflow_run` de `build.yml` ou de um trigger encadeado, um build verde pode
  nao acionar o deploy (branch errada, condicao de `if`, concurrency cancelando).
  Sintoma: estagio 3 verde, estagio 4 sem run novo para o SHA. Acao:
  `gh workflow run deploy.yml --ref main`.
- **Secret SFTP expirado.** O job de deploy falha no passo de conexao
  (`Authentication failed` / `Permission denied` no log do `deploy.yml`).
  Acao: rotacionar o secret do dominio e reexecutar.
- **"Commitou mas nao apareceu em producao".** Triagem rapida: rodar os
  estagios 2->5 em ordem. Se o commit existe (2) e o arquivo `.mdx` esta no SHA,
  o problema esta em build (3), deploy (4) ou cache (5) — nunca foi um problema
  de promote. Nao reverter o promote nesse caso; corrigir o estagio que falhou.

## 5. Limitacao conhecida e follow-up

O alerta de no-op recorrente (T010) e um STEP DENTRO do proprio
`promote-from-stockpile.yml`. Se esse workflow nao rodar (cron auto-desabilitado
pelo GitHub apos 60 dias de inatividade do repo, ou schedule suprimido), NENHUM
alerta e emitido — o watchdog nao vigia a propria ausencia. Mitigacao na
pratica: os commits diarios da routine `blog-daily` mantem o repo ativo, entao
o cron nao e auto-desabilitado.

**Follow-up cross-referenciado (T010 / D5):** um watchdog EXTERNO de "o workflow
nao rodou" (cron em outro repo, ou monitor de schedule) e a correcao definitiva.
Itens relacionados em aberto, herdados de D2/D7: alerta de estoque baixo
(`packages_available < N`, early-warning antes da janela de 3 dias) e validacao
de merge incremental de locale tardio.

## 6. Referencias

- `scripts/promote-from-stockpile.ts` — promotor; saida agregada `[PROMOTE]`,
  metrics `blog-metrics/v1`, anotacao `::error::` de orfao.
- `.github/workflows/promote-from-stockpile.yml` — cron de promote + steps
  `Detectar no-op recorrente` (T010) e `Abrir issue em caso de falha`.
- `.github/workflows/{build,deploy}.yml` — cadeia build -> deploy SFTP.
- `.claude/commands/blog/stockpile-push.md` — guard anti-orfao (exit 16).
- Tasklist `05-21-auto-blog`: `ESTUDO-AUTOPUBLICACAO-BLOG.md`,
  `DECISION-LOG.md` (D1-D9), `PROGRESS.md`.
