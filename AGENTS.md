<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:routine-rules -->
# Claude Code Routine — blog-daily

Este repositório é alvo da routine `blog-daily` que roda todos os dias ao meio-dia
via `claude.ai/code/routines`. A routine é orquestrada a partir do repo `systemForge`.

## O que a routine FAZ

- Escreve novos arquivos `.mdx` em `content/{locale}/blog/` (pt-BR, it-IT, en, es-ES)
- Atualiza `.claude/blog/data/*.json` com metadados de keywords e hreflang
- Faz `git commit + push` para `main` com mensagem no formato:
  `content(multilanguage): add N articles — daily batch {YYYY-MM-DD}`

## O que a routine NAO FAZ

- Não modifica `src/`, `config/`, `package.json`, `next.config.*` ou qualquer código
- Não altera artigos já publicados (apenas cria novos)
- Não faz merge, rebase nem altera histórico
- Não publica se o quality gate falhar

## Limites por execução

- Máximo 4 artigos por run (1 por locale)
- Máximo 200k tokens por execução

## Em caso de falha

A routine abre uma issue em `Pedrocorgnati/systemForge` com label `routine-failure`.
Nada é commitado se a execução falhar.
<!-- END:routine-rules -->
