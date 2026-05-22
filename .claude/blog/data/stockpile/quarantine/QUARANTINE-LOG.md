# QUARANTINE-LOG — Stockpile do Blog

Registro de pacotes movidos de `packages/` para `quarantine/`. Pacotes em quarentena
nao sao varridos pelo promotor (`promote-from-stockpile.ts` so le `packages/*/`) e
preservam o conteudo para decisao editorial. Nada e deletado sem aprovacao.

| Data | equivalence_id | Locales | Motivo | Origem | Acao recomendada |
|------|----------------|---------|--------|--------|------------------|
| 2026-05-21 | `2135184f-a289-4a23-a99c-49236206ff53` | pt-BR, es-ES, it-IT (3/4) | `slug_collision` nos 3 locales: os slugs `sistema-producao-bug-urgente-dev-disponivel` (pt-BR), `software-urgente-empresa-espana-rapido` (es-ES) e `sviluppo-software-urgente-pmi-italiana` (it-IT) ja existem em `content/{locale}/blog/`. | TASKLIST T005; ESTUDO §5.2 (PASSO 1). Era orfao (sem `package.json`). | Decisao editorial: o conteudo em `content/` foi publicado pelo caminho paralelo `blog-daily` (commits `212d424` em 2026-04-25 e `3a16d72` em 2026-04-13). O pacote do stockpile foi gerado depois (`generated_at` 2026-05-17/18). Decidir se a versao do stockpile substitui a versao de abril (exigiria novo slug ou sobrescrita deliberada). |

## Detalhamento de `2135184f`

**Por que quarentena e nao reconstrucao de `package.json` (Opcao A do T005):**
reconstruir o `package.json` nao tornaria o pacote promovivel. O promotor pula cada
locale cujo slug ja existe em `content/` (`promote-from-stockpile.ts`, checagem de
colisao de slug). Os 3 locales do pacote colidem, logo a promocao seria um no-op
total. Reconstruir metadados apenas adicionaria ruido de `not_available`/skip a cada
run do promotor.

**Confirmacao da hipotese H6 (caminho paralelo de publicacao):** os arquivos em
`content/{locale}/blog/` com esses slugs foram criados por commits `content(multilanguage)`
de "daily batch" — o caminho `blog-daily` documentado em `AGENTS.md`, que escreve
direto em `content/` sem passar pelo stockpile. Isso confirma H6 do TASKLIST.

**Veredito por locale (comparacao de corpo stockpile vs publicado, 2026-05-21):**
o conteudo do stockpile NAO e identico ao publicado em abril — sao variantes
distintas do mesmo topico/slug. Classificacao: `published-variant` nos 3 locales
(nenhum e `same-content`). A decisao "substituir a versao de abril" e editorial e
nao foi tomada nesta tarefa.

| Locale | Palavras (stockpile) | Palavras (publicado) | Linhas divergentes | Veredito |
|--------|---------------------:|---------------------:|-------------------:|----------|
| pt-BR  | 2158 | 2434 | 205 | `published-variant` (versao publicada e ~13% maior) |
| es-ES  | 2298 | 1663 | 210 | `published-variant` (versao do stockpile e ~38% maior) |
| it-IT  | 2225 | 2430 | 289 | `published-variant` (versao publicada e ~9% maior) |

Implicacao: nao e um simples "orfao obsoleto". Ha drift editorial entre o caminho
`blog-daily` e o stockpile gerando pecas concorrentes para o mesmo slug. O caso
es-ES (stockpile 38% mais longo) merece revisao editorial explicita antes de
decidir descartar a variante do stockpile.

**Conteudo preservado:** `quarantine/2135184f-a289-4a23-a99c-49236206ff53/` mantem
`{locale}/article.mdx` + `{locale}/reviewed.md` dos 3 locales para a decisao editorial.

**Para reverter (se a decisao for publicar a versao do stockpile):** atribuir slugs
novos no frontmatter dos 3 `reviewed.md`, reconstruir o `package.json` conforme o
procedimento da Opcao A do T005 e mover de volta para `packages/`.
