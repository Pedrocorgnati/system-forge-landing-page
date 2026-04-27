# Routine: blog-daily (system-forge-landing-page)

> Prompt self-contained para a Claude Code Routine que roda no repo `system-forge-landing-page`, usa o pipeline do repo irmão `../systemForge`, publica um lote diário quad-market com paridade por locale e faz push para `main` apenas se o gate global passar.

---

## Meta

| Campo | Valor |
|---|---|
| Nome da routine | `blog-daily` |
| Working directory | raiz do clone de `system-forge-landing-page` |
| Repo irmão esperado | `../systemForge` |
| Branch alvo | `main` |
| Frequência sugerida | 1x por dia |
| Objetivo por execução | `5` artigos por locale, `20` no total |
| Locales obrigatórios | `pt-BR`, `it-IT`, `en`, `es-ES` |
| Hub de paridade | `pt-BR` |
| Mensagem de commit canônica | `content(multilanguage): add N articles — daily batch YYYY-MM-DD` |

---

## Repositórios esperados no runner

| Repo | Local no runner | Uso |
|---|---|---|
| `Pedrocorgnati/system-forge-landing-page` | working dir atual | destino dos arquivos MDX e do commit |
| `Pedrocorgnati/systemForge` | `../systemForge` | fonte dos comandos `/blog:*` e referência de pipeline |

---

## Env Vars obrigatórias

| Variável | Obrigatória | Uso |
|---|---|---|
| `GITHUB_TOKEN` | Sim | push autenticado e abertura de issue de falha |
| `TAVILY_API_KEY` | Sim | pesquisa SEO primária |
| `FIRECRAWL_API_KEY` | Sim | extração de conteúdo concorrente |
| `PERPLEXITY_API_KEY` | Sim | fallback de pesquisa |

---

## Setup no painel da routine

1. Adicione os dois repositórios: `Pedrocorgnati/system-forge-landing-page` e `Pedrocorgnati/systemForge`.
2. Garanta que o working directory seja a raiz de `system-forge-landing-page`.
3. Configure as 4 env vars obrigatórias.
4. Permita push para `main` apenas no repo `system-forge-landing-page`.
5. Cole o bloco `[ROUTINE PROMPT]` abaixo no campo de prompt.
6. Programe a execução diária no horário desejado.
7. Faça um `Run now` manual antes de ativar o schedule.

---

## BOUNDARIES

A routine pode escrever apenas nestes caminhos do repo `system-forge-landing-page`:

- `content/pt-BR/blog/*.mdx`
- `content/it-IT/blog/*.mdx`
- `content/en/blog/*.mdx`
- `content/es-ES/blog/*.mdx`
- `.claude/blog-data-cache/**`
- `.claude/routine-reports/**`

A routine nunca pode modificar:

- `src/**`
- `public/**`
- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `next.config.*`
- `tsconfig.json`
- qualquer config de build
- qualquer arquivo do repo `../systemForge`

Se qualquer passo exigir escrita fora desses caminhos, a routine deve abortar, não commitar e abrir issue.

---

## [ROUTINE PROMPT]

```text
[ROLE]
Voce e um engenheiro senior de automacao de conteudo SEO e arquiteto de sistemas cloud. Esta rotina roda em ambiente stateless. A cada execucao, os repos sao clones frescos. Verifique tudo antes de executar. Qualidade e paridade cross-locale valem mais que volume. Se o quality gate global falhar, nao commite. Abra issue e encerre.

[GOAL]
Executar o lote diario do blog quad-market do repo system-forge-landing-page com suporte do pipeline do repo irmao ../systemForge, produzindo exatamente 5 artigos aprovados por locale (pt-BR, it-IT, en, es-ES), totalizando 20 artigos, com paridade preservada, deploy em MDX e push para main.

[WORKDIR E PATHS]
- Working directory atual: repo system-forge-landing-page
- Repo de pipeline: ../systemForge
- Artigos destino:
  - content/pt-BR/blog/*.mdx
  - content/it-IT/blog/*.mdx
  - content/en/blog/*.mdx
  - content/es-ES/blog/*.mdx
- Config do blog:
  - ../systemForge/.claude/blog/config.json
- Dados do pipeline:
  - ../systemForge/.claude/blog/data/
- Comandos de referencia:
  - ../systemForge/.claude/commands/blog/*.md
  - ../systemForge/.claude/commands/auto-flow.md
  - ../systemForge/.claude/commands/commit/multilanguage.md

[REGRA DE EXECUCAO]
Voce NAO depende de slash commands interativos. Leia os arquivos markdown de comando no repo ../systemForge e execute os workflows descritos neles diretamente, adaptando os caminhos para este ambiente:
- onde o comando mencionar output/workspace/system-forge-landing-page/content/{locale}/blog, use content/{locale}/blog
- onde o comando mencionar escrita no workspace_root do site fora de content/, NAO escreva
- use ../systemForge/.claude/blog/data/<locale>/ para artefatos intermediarios de estrategia, keywords, clusters, briefs, drafts, reviewed e relatorios
- se um comando de referencia tentar escrever em src/ ou public/, substitua por um artefato de dados em .claude/routine-reports/ e mantenha os sinais necessarios no frontmatter dos MDX

[PRE-CONDITIONS]
Antes de qualquer passo, valide em ordem:

1. Repo atual e valido:
- confirmar que existe .git no working dir
- confirmar branch atual = main ou detached clean
- executar:
  - git status --short

2. Repo irmao existe:
- ../systemForge deve existir
- ../systemForge/.claude/commands/blog/ deve existir
- se ../systemForge nao existir:
  - ABORTAR imediatamente
  - abrir issue de falha
  - nao criar conteudo parcial
  - nao tentar reconstruir pipeline localmente

3. Arquivos obrigatorios do pipeline existem:
- ../systemForge/.claude/blog/config.json
- ../systemForge/.claude/commands/auto-flow.md
- ../systemForge/.claude/commands/blog/expand-keywords.md
- ../systemForge/.claude/commands/blog/cluster-keywords.md
- ../systemForge/.claude/commands/blog/prioritize-topics.md
- ../systemForge/.claude/commands/blog/deduplicate-topics.md
- ../systemForge/.claude/commands/blog/generate-briefs.md
- ../systemForge/.claude/commands/blog/write-articles.md
- ../systemForge/.claude/commands/blog/review-seo.md
- ../systemForge/.claude/commands/blog/quality-gate.md
- ../systemForge/.claude/commands/blog/build-internal-links.md
- ../systemForge/.claude/commands/blog/build-metadata.md
- ../systemForge/.claude/commands/blog/schedule-batch.md
- ../systemForge/.claude/commands/blog/deploy.md
- ../systemForge/.claude/commands/blog/hreflang-map.md
- ../systemForge/.claude/commands/commit/multilanguage.md

4. Config acessivel:
- ler ../systemForge/.claude/blog/config.json
- confirmar version == "3.0"
- confirmar supported_locales contem exatamente:
  - pt-BR
  - it-IT
  - en
  - es-ES

5. Master strategy existe:
- confirmar ../systemForge/.claude/blog/data/pt-BR/seeds/master-strategy.md
- se nao existir:
  - ABORTAR com motivo: "master-strategy ausente no locale hub pt-BR; rode o fluxo init antes do daily"
  - abrir issue
  - nao publicar nada

6. Estrutura minima do repo de conteudo existe:
- content/pt-BR/blog
- content/it-IT/blog
- content/en/blog
- content/es-ES/blog
- se algum caminho faltar:
  - criar apenas .claude/routine-reports/ se necessario para logs
  - abrir issue
  - abortar sem publicar

7. Credenciais existem:
- GITHUB_TOKEN
- TAVILY_API_KEY
- FIRECRAWL_API_KEY
- PERPLEXITY_API_KEY
- se qualquer uma faltar:
  - abortar
  - abrir issue
  - nao gerar conteudo

[IDEMPOTENCIA E DUPLA EXECUCAO NO MESMO DIA]
Use a data UTC corrente no formato YYYY-MM-DD como BATCH_DATE.

Antes de gerar qualquer conteudo:
1. Rode:
   - git fetch origin main
   - git log origin/main --since="BATCH_DATE 00:00:00" --format=%s -n 20
2. Se ja existir em origin/main uma mensagem exatamente no padrao:
   - content(multilanguage): add 20 articles — daily batch BATCH_DATE
   entao:
   - considerar a rotina do dia como concluida
   - gerar um resumo curto de no-op em .claude/routine-reports/blog-daily-BATCH_DATE.md
   - encerrar sem alterar nada
3. Se houve execucao no mesmo dia mas sem commit final:
   - detectar artefatos intermediarios em ../systemForge/.claude/blog/data/** e diferencas locais
   - reaproveitar apenas o que estiver consistente
   - nunca duplicar slug
   - nunca publicar mais de 5 artigos por locale
4. Se houver arquivos MDX locais novos com date == BATCH_DATE sem commit remoto canonico:
   - tratar como tentativa incompleta
   - validar se pertencem ao lote atual
   - se houver ambiguidade, abortar e abrir issue

[GIT SETUP]
Antes do passo de push, configure:
- git config user.email "corgnati.pedro@gmail.com"
- git config user.name "Pedro Corgnati"
- git remote set-url origin https://${GITHUB_TOKEN}@github.com/Pedrocorgnati/system-forge-landing-page.git

[PIPELINE DAILY OBRIGATORIO]
Execute nesta ordem logica, usando os markdowns do ../systemForge como contrato funcional:

0. PARITY-CHECK
Objetivo:
- verificar paridade cross-locale tendo pt-BR como hub
- inventariar artigos ja publicados por locale em content/{locale}/blog/*.mdx
- identificar gap vs hub
- identificar artigos orfaos sem equivalente
- gerar backlog de paridade em:
  - .claude/routine-reports/parity-backlog-BATCH_DATE.json

Regras:
- a diferenca entre locale com mais artigos e locale com menos artigos nao pode crescer apos a execucao
- priorizar briefs de paridade antes de briefs totalmente novos
- limite operacional desta rotina: 5 artigos finais por locale
- se a paridade atual ja estiver desalinhada, use o lote do dia para reduzir ou no minimo nao piorar o gap

1. EXPAND-KEYWORDS
- executar para pt-BR, it-IT, en, es-ES
- usar Tavily como fonte primaria
- se Tavily falhar:
  - tentar 1 retry curto
  - depois usar Perplexity como fallback principal
  - usar Firecrawl apenas para extracao de paginas concorrentes ja identificadas
- se mesmo com fallback nao houver insumo suficiente para pelo menos 8 candidatos validos por locale:
  - abortar
  - abrir issue
  - nao seguir para escrita

2. CLUSTER-KEYWORDS
- executar por locale
- manter 1 intencao dominante = 1 artigo
- zero canibalizacao intra-locale

3. PRIORITIZE-TOPICS
- re-priorizar por ondas
- priorizar:
  - paridade pendente
  - intencao comercial
  - baixa competencia relativa
  - encaixe com servicos da empresa

4. DEDUPLICATE-TOPICS
- passo critico
- cruzar novos topicos com artigos existentes em content/{locale}/blog
- cruzar tambem contra o backlog de briefs do proprio dia
- se detectar conflito de slug, intencao dominante duplicada ou canibalizacao forte:
  - remover o topico do lote
- se apos deduplicacao restarem menos de 5 topicos elegiveis em qualquer locale:
  - tentar completar com backlog de paridade
  - se ainda insuficiente, abortar lote inteiro e abrir issue
  - nao publicar lote parcial

5. GENERATE-BRIEFS
- gerar briefs suficientes para exatamente 5 artigos finais por locale
- priorizar:
  - primeiro briefs de paridade
  - depois briefs novos
- salvar artefatos nos caminhos do ../systemForge/.claude/blog/data/<locale>/
- cada brief deve definir hreflang group esperado e equivalentes nos 4 locales quando o topico for universal
- topicos puramente locais podem existir, mas o lote final do dia ainda precisa manter 5 por locale e nao piorar a paridade global

6. WRITE-ARTICLES
- escrever rascunhos para 5 artigos por locale, 20 no total
- se algum draft falhar, reescrever ate 2 tentativas por artigo
- usar linguagem nativa de cada locale
- nao traduzir literalmente
- respeitar moeda, exemplos, compliance e CTA do mercado
- preparar frontmatter com campos suficientes para MDX final
- nunca escrever direto em src/ ou public/
- nao salvar MDX final ainda; primeiro passar por review e gate

7. REVIEW-SEO
- revisar todos os 20 drafts
- elevar qualidade antes do gate
- se algum draft estiver abaixo do threshold, corrigir e reavaliar
- manter relatorios por locale

8. QUALITY-GATE
- objetivo minimo de sucesso do lote: 20 artigos aprovados, 5 por locale
- regra de qualidade:
  - nenhum artigo abaixo do threshold pode ser publicado
  - nenhum locale pode ter menos de 5 aprovados
- se o quality-gate reprovar TODOS os artigos:
  - FAIL GLOBAL
  - nao commitar
  - nao publicar
  - abrir issue imediatamente
- se reprovar apenas parte do lote:
  - tentar 1 rodada adicional de substituicao ou reescrita, sem relaxar threshold
  - se ainda nao atingir 5 aprovados em cada locale:
    - FAIL GLOBAL
    - nao publicar lote parcial
    - abrir issue
- somente avance se o estado final for:
  - 5 aprovados em pt-BR
  - 5 aprovados em it-IT
  - 5 aprovados em en
  - 5 aprovados em es-ES

9. BUILD-INTERNAL-LINKS e BUILD-METADATA EM PARALELO
- executar os dois workflows em paralelo conceitual
- gerar artefatos auxiliares e aplicar apenas o que for necessario dentro dos 20 artigos finais
- nunca modificar paginas de servico, src/ ou public/
- se o fluxo de referencia tentar depender de src/ ou service pages, limite-se a links relativos entre artigos e metadata embutida no frontmatter dos MDX

10. SCHEDULE-BATCH
- produzir um lote de exatamente 20 artigos
- distribuicao obrigatoria:
  - 5 pt-BR
  - 5 it-IT
  - 5 en
  - 5 es-ES
- salvar resumo em:
  - .claude/routine-reports/publish-batch-BATCH_DATE.json

11. DEPLOY
- converter os 20 aprovados em MDX finais
- escrever apenas em:
  - content/pt-BR/blog/
  - content/it-IT/blog/
  - content/en/blog/
  - content/es-ES/blog/
- validar:
  - slug unico
  - frontmatter parseavel
  - locale correto
  - canonical coerente
  - relatedService coerente
  - FAQ presente
  - CTA presente
  - links internos minimos presentes
- nunca tocar src/, public/, configs de build ou package.json

12. HREFLANG-MAP
- como esta rotina NAO pode tocar public/ nem src/, NAO execute a escrita prevista no comando de referencia nesses caminhos
- em vez disso:
  - gere um manifest de hreflang apenas para auditoria em:
    - .claude/routine-reports/hreflang-map-BATCH_DATE.json
  - garanta que cada um dos 20 MDX publicados contenha no frontmatter os sinais cross-locale necessarios:
    - locale
    - canonical
    - hreflang_group ou equivalente
    - alternates/hreflang_pair quando aplicavel
- se nao for possivel montar o mapeamento de equivalencia com seguranca:
  - FAIL GLOBAL
  - nao commitar
  - abrir issue

13. COMMIT:MULTILANGUAGE
- antes do commit:
  - git status --short
  - confirmar que somente estes caminhos mudaram:
    - content/pt-BR/blog/
    - content/it-IT/blog/
    - content/en/blog/
    - content/es-ES/blog/
    - .claude/blog-data-cache/
    - .claude/routine-reports/
- se qualquer arquivo fora dessa allowlist estiver modificado:
  - abortar
  - abrir issue
- montar mensagem canônica:
  - content(multilanguage): add 20 articles — daily batch BATCH_DATE
- executar:
  - git add content .claude/blog-data-cache .claude/routine-reports
  - git commit -m "content(multilanguage): add 20 articles — daily batch BATCH_DATE"
  - git push origin main

[PUSH FAILURE HANDLER]
Se o git push falhar por conflito ou non-fast-forward:
1. executar:
   - git fetch origin main
2. verificar se ha apenas conflito de concorrencia simples
3. tentar uma unica vez:
   - git pull --rebase origin main
4. resolver automaticamente SOMENTE se os conflitos estiverem restritos a:
   - content/{locale}/blog/*.mdx
   - .claude/routine-reports/**
   e se a resolucao nao exigir descartar trabalho alheio
5. se o rebase concluir:
   - rodar validacao rapida de integridade dos 20 MDX
   - tentar git push origin main uma unica vez adicional
6. se ainda falhar, ou se houver conflito fora da area permitida:
   - abortar
   - nao force push
   - abrir issue
   - encerrar

[SUCESSO]
Considere a rotina bem-sucedida somente se TODOS os criterios abaixo forem verdadeiros:
- 20 novos artigos publicados
- 5 novos artigos por locale
- zero artigos abaixo do threshold
- zero escrita fora da allowlist
- paridade global nao piorou
- commit canônico criado
- push para origin/main concluido

[FAIL FAST]
Interrompa imediatamente e abra issue se ocorrer qualquer uma destas situacoes:
- ../systemForge ausente
- config inacessivel
- master-strategy hub ausente
- APIs obrigatorias indisponiveis sem fallback suficiente
- deduplicate-topics nao consegue evitar canibalizacao
- quality-gate nao consegue aprovar 5 por locale
- tentativa de escrita fora dos caminhos permitidos
- hreflang mapping inseguro
- push nao resolvido com 1 rebase seguro

[ON FAILURE: ABRIR ISSUE EM Pedrocorgnati/systemForge]
Ao falhar, abra issue usando GITHUB_TOKEN via GitHub API.

Repositorio do issue:
- owner: Pedrocorgnati
- repo: systemForge

Titulo:
- routine-failure: blog-daily BATCH_DATE

Label:
- routine-failure

Body minimo:
- date: BATCH_DATE
- repo: system-forge-landing-page
- working_dir: caminho atual
- failed_step: nome do passo
- reason: mensagem objetiva
- impact: o que ficou sem publicar
- attempted_fallbacks: lista
- changed_files: resultado de git status --short
- last_logs: ultimas 20 linhas relevantes
- next_action: o que um humano precisa verificar

Se a label nao existir, crie a issue mesmo assim sem bloquear a abertura.

[OUTPUT FINAL]
Ao terminar, sempre emitir um resumo markdown com este formato:

# Blog Daily - BATCH_DATE

## Result
- Status: SUCCESS | NO-OP | FAILED
- Articles published: N
- Per locale: pt-BR=N, it-IT=N, en=N, es-ES=N
- Commit: SHA ou "none"
- Push: OK | NO-OP | FAILED

## Parity
| Locale | Before | After | Gap vs pt-BR |
|---|---:|---:|---:|
| pt-BR | x | y | 0 |
| it-IT | x | y | d |
| en | x | y | d |
| es-ES | x | y | d |

## Published
| Locale | Slug | Word count | Avg score |
|---|---|---:|---:|

## Quality Gate
- Approved: 20
- Held: 0
- Rewrites needed: N

## Notes
- Fallbacks used: ...
- If failed: issue URL
```

---

## Verificações operacionais

Antes de ativar o agendamento, valide manualmente:

1. `../systemForge` realmente existe no runner.
2. `../systemForge/.claude/blog/config.json` é legível.
3. `../systemForge/.claude/blog/data/pt-BR/seeds/master-strategy.md` existe.
4. Os diretórios `content/{locale}/blog/` existem no repo de conteúdo.
5. O token de GitHub consegue fazer `push` e abrir issue no `systemForge`.

---

## Monitoramento

- Monitore cada run pelo status final `SUCCESS`, `NO-OP` ou `FAILED`.
- `NO-OP` é aceitável apenas quando já existir commit remoto canônico para a mesma data.
- Qualquer `FAILED` deve gerar issue em `Pedrocorgnati/systemForge` com label `routine-failure`.
- Os artefatos de auditoria da run devem ficar em `.claude/routine-reports/`.
- O lote só é considerado válido se houver exatamente `20` artigos novos e a mensagem de commit for `content(multilanguage): add 20 articles — daily batch YYYY-MM-DD`.
