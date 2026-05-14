# Blog Pipeline — Triple-Market (BR/IT/EN)

## Configuração

Arquivo: `.claude/blog/config.json` (v3.0)

| Mercado | Locale | Domínio | Frequência |
|---------|--------|---------|------------|
| BR | pt-BR | forjadesistemas.com.br | Semanal |
| IT | it-IT | systemforge.it | Quinzenal |
| EN | en | systemforgesoftware.com | Quinzenal |

---

## Como executar

### Primeira vez (INIT)

```bash
# Pipeline completo de inicialização — executa estratégia + intents + keywords + clusters + briefs + artigos + review + deploy
/auto-flow blog init
```

O pipeline INIT percorre todos os 3 mercados sequencialmente ou em paralelo, dependendo da configuração.

### Execução diária/semanal (DAILY)

```bash
# Pipeline recorrente — pula estratégia e intents (já existem), foca em gerar e publicar
/auto-flow blog daily
# ou simplesmente:
/auto-flow blog
```

### Execução mensal

```bash
# Análise de performance + refresh de conteúdo existente
/auto-flow blog mensal
```

---

## Pipeline INIT (primeira vez)

```
/blog:init-strategy
  → /blog:discover-intents
  → /blog:discover-intents-part2
  → /blog:expand-keywords
  → /blog:cluster-keywords
  → /blog:prioritize-topics
  → /blog:deduplicate-topics
  → /blog:generate-briefs
  → /blog:write-articles
  → /blog:review-seo
  → /blog:quality-gate
  → /blog:build-internal-links + /blog:build-metadata
  → /blog:schedule-batch
  → /blog:deploy
```

## Pipeline DAILY (recorrente)

```
/blog:expand-keywords
  → /blog:cluster-keywords
  → /blog:prioritize-topics
  → /blog:deduplicate-topics
  → /blog:generate-briefs
  → /blog:write-articles
  → /blog:review-seo
  → /blog:quality-gate
  → /blog:build-internal-links + /blog:build-metadata
  → /blog:schedule-batch
  → /blog:deploy
```

---

## Dependências de cada comando

| Comando | Precisa de |
|---------|------------|
| `/blog:init-strategy` | `locale`, `domain`, `icp`, `pillars` no `config.json` |
| `/blog:expand-keywords` | `master-strategy.md` (gerado por init-strategy) |
| `/blog:generate-briefs` | clusters priorizados e deduplicados |
| `/blog:write-articles` | briefs em `.claude/blog/data/briefs-{market}/` |
| `/blog:deploy` | build output `out-{market}/` e `velite_rebuild: true` no config |

---

## Hub & Spoke — Artigos Universais vs Exclusivos

### Artigos Exclusivos

Publicados em apenas um mercado. Sem hreflang alternates para outros domínios.

```yaml
# frontmatter de artigo exclusivo
locale: pt-BR
exclusive: true
# NÃO incluir hreflang_pair
```

Exemplo: artigo sobre "mercado de software em São Paulo" — irrelevante para IT/EN.

### Artigos Universais

Publicados nos 3 mercados com tradução adaptada. Obrigam 3 alternates + x-default.

```yaml
# frontmatter de artigo universal
locale: pt-BR
exclusive: false
hreflang_pair:
  - locale: it-IT
    slug: sviluppo-software-su-misura
  - locale: en
    slug: custom-software-development
```

Tags universais (sempre marcam candidatos a artigo universal): `nextjs`, `software-development`, `automation`.

---

## Estrutura de Dados

```
.claude/blog/
├── config.json               ← Configuração v3.0 (markets + locales + rules)
├── README.md                 ← Este arquivo
├── templates/                ← Templates para cada step do pipeline
│   ├── ARTICLE_BRIEF_TEMPLATE.md
│   ├── INTERNAL_LINK_TEMPLATE.md
│   └── SEO_REVIEW_TEMPLATE.md
└── data/
    ├── keywords-br.json      ← Preenchido por /blog:expand-keywords (BR)
    ├── keywords-it.json      ← Preenchido por /blog:expand-keywords (IT)
    ├── keywords-en.json      ← Preenchido por /blog:expand-keywords (EN)
    ├── briefs-br/            ← Briefs gerados por /blog:generate-briefs (BR)
    ├── briefs-it/            ← Briefs gerados por /blog:generate-briefs (IT)
    ├── briefs-en/            ← Briefs gerados por /blog:generate-briefs (EN)
    └── pt-BR/                ← Dados existentes do pipeline BR (legacy path)
        ├── seeds/            ← Estratégia e pesquisa Codex
        ├── raw-keywords/     ← Keywords expandidas
        ├── clustered-keywords/
        ├── prioritized-topics/
        ├── article-briefs/   ← Briefs individuais
        └── drafts/           ← Rascunhos de artigos
```

---

## Deploy

O comando `/blog:deploy` usa `deploy.build_command_by_market` do `config.json`:

```json
"build_command_by_market": {
  "br": "npm run build:br",
  "it": "npm run build:it",
  "en": "npm run build:en"
}
```

Com `velite_rebuild: true`, o Velite recompila as coleções antes do build Next.js.

Coleções Velite por mercado: `ptBRPosts`, `itITPosts`, `enPosts`.
