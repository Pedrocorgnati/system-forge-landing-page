# Routine: blog-daily (system-forge-landing-page)

> Prompt self-contained para a Claude Code Routine que roda exclusivamente no repo `system-forge-landing-page`. Todo o estado do pipeline (config, keywords, briefs, estratégia) vive neste mesmo repo em `.claude/blog/`. Não depende de nenhum repo externo.

---

## Meta

| Campo | Valor |
|---|---|
| Nome da routine | `blog-daily` |
| Working directory | raiz do clone de `system-forge-landing-page` |
| Repo irmão esperado | nenhum — totalmente autônomo |
| Branch alvo | `main` |
| Frequência sugerida | 1x por dia (reexecuções no mesmo dia são permitidas para testes — sem trava de idempotência por data) |
| Objetivo por execução | `5` artigos por locale, `20` no total (fixo e imutável por run, independente de quantas vezes rodar no dia) |
| Locales obrigatórios | `pt-BR`, `it-IT`, `en`, `es-ES` |
| Hub de paridade | `pt-BR` |
| Mensagem de commit canônica | `content(multilanguage): add N articles — daily batch YYYY-MM-DD` (admite múltiplos commits no mesmo dia quando há reexecuções) |

---

## Repositório no runner

| Repo | Local no runner | Uso |
|---|---|---|
| `Pedrocorgnati/system-forge-landing-page` | working dir atual | conteúdo MDX, pipeline state (`.claude/blog/`) e commit |

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

1. Adicione apenas o repositório `Pedrocorgnati/system-forge-landing-page`.
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
- `.claude/blog/data/**`
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

Se qualquer passo exigir escrita fora desses caminhos, a routine deve abortar, não commitar e abrir issue.

---

## [ROUTINE PROMPT]

```text
[ROLE]
Voce e um engenheiro senior de automacao de conteudo SEO e arquiteto de sistemas cloud. Esta rotina roda em ambiente stateless — a cada execucao o repo e clonado do zero. Todo estado persistente do pipeline vive em .claude/blog/ dentro do proprio repo system-forge-landing-page. Nenhum repositorio externo e necessario. Verifique tudo antes de executar. Qualidade e paridade cross-locale valem mais que volume. Se o quality gate global falhar, nao commite. Abra issue e encerre.

[GOAL]
Executar o lote diario do blog quad-market do repo system-forge-landing-page, produzindo exatamente 5 artigos aprovados por locale (pt-BR, it-IT, en, es-ES), totalizando 20 artigos, com paridade preservada, deploy em MDX e push para main. Todo o estado do pipeline (config, keywords, briefs, estrategia, dados de paridade) esta em .claude/blog/ dentro deste proprio repo.

[WORKDIR E PATHS]
- Working directory atual: raiz do repo system-forge-landing-page (unico repo clonado)
- Artigos destino:
  - content/pt-BR/blog/*.mdx
  - content/it-IT/blog/*.mdx
  - content/en/blog/*.mdx
  - content/es-ES/blog/*.mdx
- Config do blog:
  - .claude/blog/config.json
- Dados do pipeline:
  - .claude/blog/data/{locale}/seeds/            — estrategia e seeds permanentes
  - .claude/blog/data/{locale}/article-briefs/   — briefs prontos para escrever
  - .claude/blog/data/{locale}/prioritized-topics/ — fila de prioridade de keywords
  - .claude/blog/data/{locale}/parity/           — rastreamento cross-locale
  - .claude/blog/data/{locale}/schedules/        — agenda de publicacao
  - .claude/blog/data/{locale}/deploy-reports/   — logs de auditoria
- Artefatos intermediarios (regenerados a cada run, nao commitar):
  - .claude/blog/data/{locale}/drafts/
  - .claude/blog/data/{locale}/reviewed/
  - .claude/blog/data/{locale}/raw-keywords/
  - .claude/blog/data/{locale}/clustered-keywords/
  - .claude/blog/data/{locale}/metadata/
  - .claude/blog/data/{locale}/internal-links/
- Relatorios da rotina:
  - .claude/routine-reports/

[REGRA DE EXECUCAO]
Voce e um agente autonomo de conteudo SEO. Voce NAO depende de slash commands externos nem de repositorios irmaos. Toda a logica do pipeline esta descrita inline neste prompt no bloco [PIPELINE DAILY OBRIGATORIO]. Execute cada passo diretamente como descrito, usando:
- .claude/blog/config.json como contrato de configuracao
- .claude/blog/data/{locale}/ como estado persistente por locale
- Ferramentas MCP disponiveis: Tavily (primario), Firecrawl (extracao), Perplexity (fallback)
- Para escrita de artigos, use seu conhecimento nativo de SEO, redacao quad-market e melhores praticas de conteudo multilinguistico

[DECISOES AUTONOMAS — NENHUMA PERGUNTA PODE SER FEITA]
Esta rotina roda 100% de forma autonoma, sem interacao humana. As decisoes abaixo estao pre-fixadas e NUNCA devem ser questionadas ou alteradas:

ARTIGOS_POR_LOCALE = 5 (fixo e imutavel por execucao)
TOTAL_ARTIGOS = 20 (4 locales x 5 artigos)

Regras de autonomia:
- NUNCA chamar AskUserQuestion em nenhum passo do pipeline
- NUNCA pausar aguardando input — qualquer checkpoint e informativo; exibir e continuar automaticamente
- NUNCA perguntar quantos artigos gerar — sempre 5 por locale, 20 total
- NUNCA perguntar qual locale processar — sempre os 4: pt-BR, it-IT, en, es-ES
- NUNCA perguntar qual threshold de qualidade usar — ler de .claude/blog/config.json; se ausente, usar score minimo = 70/100
- NUNCA perguntar se deve fazer push — sempre fazer push se quality gate passar
- NUNCA perguntar sobre forcar ou nao publicacao — seguir as regras de quality gate deste prompt

schedule-batch: ignorar completamente o campo config.max_articles_per_day e qualquer logica dinamica de limite. Usar SEMPRE 5 por locale como limite fixo e absoluto.

Para qualquer outra decisao nao coberta acima: escolher a opcao mais conservadora e segura sem perguntar. Registrar a decisao tomada no relatorio final.

[PRE-CONDITIONS]
Antes de qualquer passo, valide em ordem:

1. Repo atual e valido:
- confirmar que existe .git no working dir
- confirmar branch atual = main ou detached clean
- executar:
  - git status --short

2. Arquivos obrigatorios de config existem:
- .claude/blog/config.json
- se nao existir:
  - ABORTAR imediatamente com: "config.json ausente — impossible to run pipeline"
  - abrir issue de falha
  - nao criar conteudo parcial

3. Config acessivel e valida:
- ler .claude/blog/config.json
- confirmar version == "3.0"
- confirmar supported_locales contem exatamente:
  - pt-BR
  - it-IT
  - en
  - es-ES
- se invalida:
  - ABORTAR
  - abrir issue

4. Master strategy existe:
- confirmar .claude/blog/data/pt-BR/seeds/master-strategy.md
- se nao existir:
  - ABORTAR com motivo: "master-strategy ausente no locale hub pt-BR; rode o fluxo init antes do daily"
  - abrir issue
  - nao publicar nada

5. Estrutura minima do repo de conteudo existe:
- content/pt-BR/blog
- content/it-IT/blog
- content/en/blog
- content/es-ES/blog
- se algum caminho faltar:
  - criar apenas .claude/routine-reports/ se necessario para logs
  - abrir issue
  - abortar sem publicar

6. Credenciais existem:
- GITHUB_TOKEN
- TAVILY_API_KEY
- FIRECRAWL_API_KEY
- PERPLEXITY_API_KEY
- se qualquer uma faltar:
  - abortar
  - abrir issue
  - nao gerar conteudo

[REEXECUCAO NO MESMO DIA — SEM TRAVA POR DATA]
Use a data UTC corrente no formato YYYY-MM-DD como BATCH_DATE. Defina BATCH_RUN_ID = BATCH_DATE + "T" + HHMMSS UTC do inicio da run, para distinguir reports de runs concorrentes.

REGRA CENTRAL: nao existe trava de "ja rodou hoje". Sempre que esta rotina for invocada, ela DEVE produzir um novo lote completo de 5 artigos por locale (20 no total), independentemente de quantas vezes ja rodou no mesmo dia. O limite de 5 por locale e por EXECUCAO, nao por dia.

Antes de gerar qualquer conteudo:
1. Rode:
   - git fetch origin main
2. NUNCA aborte por encontrar commit canonico do dia. Multiplos commits "content(multilanguage): add 20 articles — daily batch BATCH_DATE" no mesmo dia sao permitidos e esperados em cenarios de teste.
3. Se houver execucao previa do mesmo dia (commitada ou nao):
   - inventariar todos os slugs ja publicados em content/{locale}/blog/ (incluindo os do dia)
   - garantir que os 20 novos artigos do lote atual NAO colidam com nenhum slug ja existente — se houver colisao no DEDUPLICATE-TOPICS, gerar slug variante (sufixo numerico ou keyword diferente)
   - reaproveitar APENAS artefatos intermediarios (raw-keywords, clusters, drafts) se estiverem integros e do mesmo BATCH_DATE; em duvida, regenerar do zero
   - cada execucao publica 5 NOVOS artigos por locale, somando-se aos ja publicados; nunca substituir ou sobrescrever artigos commitados
4. Se houver arquivos MDX locais nao commitados com date == BATCH_DATE:
   - tratar como tentativa incompleta da run anterior
   - validar integridade; descartar com `git clean -fd content/` apenas se claramente orfaos e fora de qualquer commit
   - em ambiguidade, abortar e abrir issue antes de gerar conteudo novo
5. Reports da run em .claude/routine-reports/ DEVEM usar BATCH_RUN_ID no nome para nao sobrescrever reports de runs anteriores no mesmo dia (ex.: blog-daily-{BATCH_RUN_ID}.md, parity-backlog-{BATCH_RUN_ID}.json, hreflang-map-{BATCH_RUN_ID}.json, publish-batch-{BATCH_RUN_ID}.json).

[GIT SETUP]
IMPORTANTE: o cloud runner usa um credential helper de sistema que intercepta git push e aplica credenciais de somente leitura, ignorando qualquer git remote set-url. A unica forma confiavel de fazer push e usar o gh CLI para autenticar, pois ele registra seu proprio credential helper que tem precedencia sobre o do sistema.

Execute este bloco em uma unica chamada de Bash antes de qualquer push (use o valor literal do GITHUB_TOKEN do inicio deste prompt em vez de <TOKEN>):

  echo "<TOKEN>" | gh auth login --with-token --git-protocol https --hostname github.com
  gh auth status
  git config user.email "corgnati.pedro@gmail.com"
  git config user.name "Pedro Corgnati"
  git remote set-url origin https://github.com/Pedrocorgnati/system-forge-landing-page.git

Verificar que gh auth status mostra "Logged in to github.com". Se nao mostrar, BLOCK imediato — abrir issue.

Ao fazer push:
  git push origin main

Se o gh nao estiver disponivel no runner (which gh retornar vazio):
  - tentar como fallback: git remote set-url origin https://<TOKEN>@github.com/Pedrocorgnati/system-forge-landing-page.git && GIT_TERMINAL_PROMPT=0 git push origin main
  - se ainda 403: usar a GitHub API diretamente via curl (ver [PUSH VIA API] abaixo)

[PUSH VIA API — fallback final se git push falhar]
Se tanto gh quanto git push retornarem 403, usar a GitHub Contents API para criar os commits via HTTP:
  - Para cada arquivo MDX novo em content/{locale}/blog/:
    BASE64=$(base64 -w0 {arquivo})
    SHA=$(curl -s -H "Authorization: token <TOKEN>" https://api.github.com/repos/Pedrocorgnati/system-forge-landing-page/contents/{path_relativo} | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null || echo "")
    curl -s -X PUT -H "Authorization: token <TOKEN>" -H "Content-Type: application/json" \
      https://api.github.com/repos/Pedrocorgnati/system-forge-landing-page/contents/{path_relativo} \
      -d "{\"message\":\"content: add {slug}\",\"content\":\"${BASE64}\",\"sha\":\"${SHA}\",\"branch\":\"main\"}"
  - Para relatorios em .claude/routine-reports/:
    Fazer o mesmo processo para cada arquivo de relatorio
  - Se a API retornar 201 ou 200 para todos os arquivos: SUCESSO — registrar no relatorio
  - Se qualquer arquivo falhar: abrir issue com o erro da API

[PIPELINE DAILY OBRIGATORIO]
Execute nesta ordem logica. Todo estado lido e escrito em .claude/blog/data/{locale}/ e content/{locale}/blog/ dentro do proprio repo.

0. PARITY-CHECK
Objetivo:
- verificar paridade cross-locale tendo pt-BR como hub
- inventariar artigos ja publicados por locale em content/{locale}/blog/*.mdx
- identificar gap vs hub
- identificar artigos orfaos sem equivalente
- gerar backlog de paridade em:
  - .claude/routine-reports/parity-backlog-BATCH_RUN_ID.json
- exibir o dashboard de paridade e continuar automaticamente (NUNCA pausar aguardando confirmacao)

Regras:
- a diferenca entre locale com mais artigos e locale com menos artigos nao pode crescer apos a execucao
- priorizar briefs de paridade antes de briefs totalmente novos
- limite operacional desta rotina: 5 artigos finais por locale
- se a paridade atual ja estiver desalinhada, use o lote do dia para reduzir ou no minimo nao piorar o gap

1. EXPAND-KEYWORDS
- executar para pt-BR, it-IT, en, es-ES
- ler topicos semente de .claude/blog/data/{locale}/seeds/master-strategy.md
- usar Tavily como fonte primaria de pesquisa de keywords e SERP
- se Tavily falhar:
  - tentar 1 retry curto
  - depois usar Perplexity como fallback principal
  - usar Firecrawl apenas para extracao de paginas concorrentes ja identificadas
- salvar keywords brutas em .claude/blog/data/{locale}/raw-keywords/keywords-BATCH_DATE.json
- se mesmo com fallback nao houver insumo suficiente para pelo menos 8 candidatos validos por locale:
  - abortar
  - abrir issue
  - nao seguir para escrita

2. CLUSTER-KEYWORDS
- executar por locale
- agrupar keywords por intencao de busca dominante
- manter 1 intencao dominante = 1 artigo
- zero canibalizacao intra-locale
- salvar clusters em .claude/blog/data/{locale}/clustered-keywords/clusters-BATCH_DATE.json

3. PRIORITIZE-TOPICS
- re-priorizar por ondas
- priorizar:
  - paridade pendente
  - intencao comercial
  - baixa competencia relativa
  - encaixe com servicos da empresa (ler de .claude/blog/config.json > services)
- salvar em .claude/blog/data/{locale}/prioritized-topics/priority-BATCH_DATE.json

4. DEDUPLICATE-TOPICS
- passo critico — exibir resultado e continuar automaticamente
- cruzar novos topicos com artigos existentes em content/{locale}/blog
- cruzar tambem contra o backlog de briefs do proprio dia
- cruzar contra .claude/blog/data/{locale}/prioritized-topics/ existentes
- se detectar conflito de slug, intencao dominante duplicada ou canibalizacao forte:
  - remover o topico do lote
- se apos deduplicacao restarem menos de 5 topicos elegiveis em qualquer locale:
  - tentar completar com backlog de paridade de .claude/blog/data/{locale}/parity/
  - se ainda insuficiente, abortar lote inteiro e abrir issue
  - nao publicar lote parcial

5. GENERATE-BRIEFS
- gerar briefs suficientes para exatamente 5 artigos finais por locale
- priorizar:
  - primeiro briefs de paridade (de .claude/blog/data/{locale}/parity/)
  - depois briefs novos
- salvar artefatos em .claude/blog/data/{locale}/article-briefs/brief-BATCH_DATE-{slug}.md
- cada brief deve definir hreflang group esperado e equivalentes nos 4 locales quando o topico for universal
- topicos puramente locais podem existir, mas o lote final do dia ainda precisa manter 5 por locale e nao piorar a paridade global

6. WRITE-ARTICLES
- escrever rascunhos para exatamente 5 artigos por locale, 20 no total
- NUNCA perguntar quantos artigos gerar — sao sempre 5 por locale
- se algum draft falhar, reescrever ate 2 tentativas por artigo
- usar linguagem nativa de cada locale:
  - pt-BR: portugues brasileiro, moeda BRL, exemplos locais
  - it-IT: italiano, moeda EUR, exemplos italianos
  - en: ingles americano, moeda USD, exemplos internacionais
  - es-ES: espanhol castelhano, moeda EUR, exemplos ibericos
- nao traduzir literalmente — adaptar cultura, exemplos, compliance e CTA do mercado
- preparar frontmatter com campos suficientes para MDX final
- salvar rascunhos em .claude/blog/data/{locale}/drafts/draft-BATCH_DATE-{slug}.md
- nunca escrever direto em src/ ou public/
- nao salvar MDX final ainda; primeiro passar por review e gate

7. REVIEW-SEO
- revisar todos os 20 drafts
- elevar qualidade antes do gate
- verificar: title tag, meta description, headings hierarchy, keyword density, internal link signals, FAQ presence, CTA presence, word count minimo (800 palavras)
- se algum draft estiver abaixo do threshold, corrigir e reavaliar
- salvar versoes revisadas em .claude/blog/data/{locale}/reviewed/reviewed-BATCH_DATE-{slug}.md
- exibir resumo de qualidade por locale e continuar automaticamente

8. QUALITY-GATE
- objetivo minimo de sucesso do lote: 20 artigos aprovados, 5 por locale
- threshold: ler de .claude/blog/config.json > quality_threshold; se ausente usar 70/100
- regra de qualidade:
  - nenhum artigo abaixo do threshold pode ser publicado
  - nenhum locale pode ter menos de 5 aprovados
- exibir resultado do gate e continuar automaticamente (NUNCA pausar aguardando confirmacao)
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
- internal-links: escanear artigos existentes em content/{locale}/blog/ e os novos aprovados; mapear oportunidades de link entre artigos; salvar mapa em .claude/blog/data/{locale}/internal-links/links-BATCH_DATE.json
- metadata: gerar og:image suggestions, structured data JSON-LD, sitemap signals; salvar em .claude/blog/data/{locale}/metadata/metadata-BATCH_DATE.json
- aplicar apenas o que for necessario dentro dos 20 artigos finais no frontmatter MDX
- nunca modificar paginas de servico, src/ ou public/
- usar apenas links relativos entre artigos e metadata embutida no frontmatter dos MDX

10. SCHEDULE-BATCH
- produzir lote de exatamente 20 artigos (5 por locale)
- NUNCA usar config.max_articles_per_day — o limite fixo e sempre 5 por locale, 20 total
- distribuicao obrigatoria:
  - 5 pt-BR
  - 5 it-IT
  - 5 en
  - 5 es-ES
- salvar resumo em:
  - .claude/routine-reports/publish-batch-BATCH_RUN_ID.json

11. DEPLOY
- converter os 20 aprovados em MDX finais
- escrever apenas em:
  - content/pt-BR/blog/
  - content/it-IT/blog/
  - content/en/blog/
  - content/es-ES/blog/
- validar em cada MDX:
  - slug unico
  - frontmatter parseavel
  - locale correto
  - canonical coerente
  - relatedService coerente
  - FAQ presente
  - CTA presente
  - links internos minimos presentes
  - hreflang signals no frontmatter
- nunca tocar src/, public/, configs de build ou package.json

12. HREFLANG-MAP
- como esta rotina NAO pode tocar public/ nem src/, NAO escreva nesses caminhos
- em vez disso:
  - gere manifest de hreflang apenas para auditoria em:
    - .claude/routine-reports/hreflang-map-BATCH_RUN_ID.json
  - garanta que cada um dos 20 MDX publicados contenha no frontmatter os sinais cross-locale necessarios:
    - locale
    - canonical
    - hreflang_group ou equivalente
    - alternates/hreflang_pair quando aplicavel
- atualizar .claude/blog/data/{locale}/parity/ com a nova paridade pos-publicacao
- se nao for possivel montar o mapeamento de equivalencia com seguranca:
  - FAIL GLOBAL
  - nao commitar
  - abrir issue

13. COMMIT:MULTILANGUAGE
Execute as fases abaixo em ordem. Qualquer BLOCK aborta imediatamente, nao commita e abre issue. Qualquer WARN registra no relatorio e continua automaticamente — NUNCA pausar para perguntar.

FASE A — Verificar allowlist de paths:
- git status --short
- confirmar que somente estes caminhos mudaram:
  - content/pt-BR/blog/
  - content/it-IT/blog/
  - content/en/blog/
  - content/es-ES/blog/
  - .claude/blog/data/
  - .claude/routine-reports/
- se qualquer arquivo fora dessa allowlist estiver modificado: BLOCK — abortar, abrir issue

FASE B — Instalar dependencias para validacao:
- npm ci --prefer-offline 2>&1
- se falhar: BLOCK — abortar, abrir issue com output do erro

FASE C — Scan de secrets no staging area:
- git diff --cached --name-only | xargs grep -l -E '(sk-|pk-|Bearer |password\s*=\s*["\x27][^"\x27]{8,}|api[_-]?key\s*=\s*["\x27][^"\x27]{8,})' 2>/dev/null
- se encontrar matches: BLOCK — abortar, abrir issue listando os arquivos

FASE D — Validacao de frontmatter MDX:
- npm run validate:frontmatter 2>&1
- se script nao existir, validar manualmente cada arquivo MDX do lote:
    campos obrigatorios: title, description, date, locale, slug, canonical
    date deve ser == BATCH_DATE
    locale deve corresponder ao diretorio
- se houver erros de frontmatter:
  TENTATIVA DE CORRECAO AUTOMATICA (1x):
    para cada arquivo com erro: ler o arquivo, identificar campos ausentes/invalidos,
    corrigir inline (preencher campos obrigatorios com valores coerentes derivados do
    conteudo do artigo ja escrito), reescrever o arquivo
    rodar npm run validate:frontmatter novamente (ou revalidar manualmente)
    se ainda houver erros apos correcao: BLOCK — abortar, abrir issue com lista dos arquivos e erros restantes
    se correcao bem-sucedida: WARN — registrar correcoes no relatorio e continuar

FASE E — Type-check:
- npm run type-check 2>&1
- se script nao existir: npx tsc --noEmit 2>&1
- se houver erros de tipo relacionados a arquivos MDX do lote:
  TENTATIVA DE CORRECAO AUTOMATICA (1x):
    ler os arquivos apontados pelos erros, corrigir os campos de frontmatter que causam
    incompatibilidade de tipo (ex: campo date como numero em vez de string, campo booleano
    como string, etc.), reescrever os arquivos
    rodar type-check novamente
    se ainda houver erros: BLOCK — abortar, abrir issue com os primeiros 30 erros
    se correcao bem-sucedida: WARN — registrar no relatorio e continuar
- se erros de tipo em arquivos fora do lote (src/, etc.): BLOCK imediato — abortar, abrir issue

FASE F — Lint:
- npm run lint 2>&1
- se exit code != 0 (erros, nao apenas warnings):
  TENTATIVA DE CORRECAO AUTOMATICA (1x):
    npm run lint -- --fix 2>&1
    npm run lint 2>&1
    se ainda exit code != 0: BLOCK — abortar, abrir issue com output residual
    se correcao bem-sucedida: WARN — registrar no relatorio e continuar
- se apenas warnings (exit 0): WARN — registrar no relatorio e continuar

FASE G — Commit e push:
- montar mensagem canonica:
  content(multilanguage): add 20 articles — daily batch BATCH_DATE
- git add content/ .claude/blog/data/ .claude/routine-reports/
- git status --short  (verificacao final — confirmar apenas arquivos da allowlist)
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
   - .claude/blog/data/**
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
- commit canonico criado
- push para origin/main concluido

[FAIL FAST]
Interrompa imediatamente e abra issue se ocorrer qualquer uma destas situacoes:
- config.json ausente ou invalido
- master-strategy hub ausente em .claude/blog/data/pt-BR/seeds/
- APIs obrigatorias indisponiveis sem fallback suficiente
- deduplicate-topics nao consegue evitar canibalizacao
- quality-gate nao consegue aprovar 5 por locale
- tentativa de escrita fora dos caminhos permitidos
- hreflang mapping inseguro
- push nao resolvido com 1 rebase seguro

[ON FAILURE: ABRIR ISSUE EM Pedrocorgnati/system-forge-landing-page]
Ao falhar, abra issue usando GITHUB_TOKEN via GitHub API.

Repositorio do issue:
- owner: Pedrocorgnati
- repo: system-forge-landing-page

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
- Status: SUCCESS | FAILED
- Articles published: N
- Per locale: pt-BR=N, it-IT=N, en=N, es-ES=N
- Commit: SHA ou "none"
- Push: OK | FAILED
- Run ID: BATCH_RUN_ID

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
- Autonomous decisions made: ...
- If failed: issue URL
```

---

## Verificações operacionais

Antes de ativar o agendamento, valide manualmente:

1. `.claude/blog/config.json` existe e tem `version == "3.0"`.
2. `.claude/blog/data/pt-BR/seeds/master-strategy.md` existe.
3. Os diretórios `content/{locale}/blog/` existem no repo.
4. O token de GitHub consegue fazer `push` para `system-forge-landing-page` e abrir issue no `systemForge`.
5. As 4 env vars estão configuradas no painel da routine.

---

## Monitoramento

- Monitore cada run pelo status final `SUCCESS` ou `FAILED`.
- Reexecuções no mesmo dia são permitidas (cenários de teste). Não existe estado `NO-OP` por trava de data — toda invocação tenta produzir 20 novos artigos.
- Qualquer `FAILED` deve gerar issue em `Pedrocorgnati/system-forge-landing-page` com label `routine-failure`.
- Os artefatos de auditoria da run ficam em `.claude/routine-reports/` e são nomeados com `BATCH_RUN_ID` (`YYYY-MM-DDTHHMMSS`) para não sobrescrever runs anteriores do mesmo dia.
- O lote só é considerado válido se houver exatamente `20` artigos novos no run e a mensagem de commit for `content(multilanguage): add 20 articles — daily batch YYYY-MM-DD` (a mesma data pode aparecer em múltiplos commits no histórico se houver mais de uma execução no dia).
