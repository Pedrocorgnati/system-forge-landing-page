# multi-domain-rules — Regras canônicas do quad-market

Última revisão: 2026-05-19. Quatro domínios, quatro locales, um repo, um
deploy pipeline. Qualquer assimetria entre eles é breakage por design —
mesmo se o build verde individual passar.

## 1. Mapa dos 4 mercados

| Locale | Domínio | Currency | Compliance | Email | WhatsApp env | Cloudflare zone secret | SFTP prefix | Build suffix |
|---|---|---|---|---|---|---|---|---|
| `pt-BR` | forjadesistemas.com.br | BRL | LGPD | contato@forjadesistemas.com.br | `NEXT_PUBLIC_WHATSAPP_NUMBER_BR` | `CLOUDFLARE_ZONE_ID` | `SFTP_BR_*` | `br` |
| `it-IT` | systemforge.it | EUR | GDPR | contatto@systemforge.it | `NEXT_PUBLIC_WHATSAPP_NUMBER_IT` | `CLOUDFLARE_ZONE_ID_IT` | `SFTP_IT_*` | `it` |
| `en` | systemforgesoftware.com | USD | CAN-SPAM | contact@systemforgesoftware.com | `NEXT_PUBLIC_WHATSAPP_NUMBER_EN` | `CLOUDFLARE_ZONE_ID_EN` | `SFTP_EN_*` | `en` |
| `es-ES` | systemforge.es | EUR | GDPR | hola@systemforge.es | `NEXT_PUBLIC_WHATSAPP_NUMBER_ES` | `CLOUDFLARE_ZONE_ID_ES` | `SFTP_ES_*` | `es` |

> Campo `compliance` aceita apenas `'LGPD' | 'GDPR' | 'CAN-SPAM'`
> (`config/types.ts:10`). CCPA é regulação relevante para EN mas **não** é
> valor literal do enum — citar como nota textual quando aplicável.

Notas:
- A zona BR usa o secret legado `CLOUDFLARE_ZONE_ID` (sem sufixo). Não renomear.
- WhatsApp foi unificado por engano no passado (`NEXT_PUBLIC_WHATSAPP_NUMBER`);
  agora é per-locale obrigatoriamente em runtime via `config/sites/{br,it,en,es}.ts`.
  Fallback hardcoded ganha quando a env não está setada.
- **Divergência CI ativa (tech-debt P1):** `build.yml` linha 123 ainda exporta
  apenas `NEXT_PUBLIC_WHATSAPP_NUMBER` (sem sufixo) para todos os 4 builds da
  matrix. Em runtime de CI o fallback per-locale do `.ts` sempre vence — a tabela
  acima descreve o contrato canônico, **não** o estado atual do workflow. Quem
  unificar a coluna `whatsapp` em `WORKFLOW-INDEX`/secrets deve simultaneamente
  refatorar `build.yml` para `NEXT_PUBLIC_WHATSAPP_NUMBER_${BUILD_SUFFIX^^}`.
- **Bug ativo em `config/sites/es.ts:21`:** fallback `+393508751885` é o **mesmo**
  número da Itália. Cliente espanhol cai no WhatsApp italiano se a env
  `NEXT_PUBLIC_WHATSAPP_NUMBER_ES` não estiver setada (cenário comum em build
  local / preview branches). Corrigir hardcode ou tornar secret obrigatório.
- **Divergência `en.ts:20` E `it.ts:20`:** ambos hardcodam email
  (`hello@systemforgesoftware.com` e `contatto@systemforge.it`) ignorando
  `NEXT_PUBLIC_CONTACT_EMAIL`. Só `br.ts` e `es.ts` leem env com fallback.
  No CI, `build.yml` matrix declara `contact_email: contact@systemforgesoftware.com`
  para EN — divergente do hardcode `hello@`. Para ES,
  `quality-gate.yml:81` exporta `NEXT_PUBLIC_CONTACT_EMAIL=contacto@systemforge.es`
  enquanto `build.yml` matrix usa `hola@systemforge.es` (e o config ES tem
  fallback `hola@`). Três divergências distintas; precisam ser reconciliadas
  em PR único (unificar `email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '<fallback>'`
  em todos os 4 configs + alinhar matrix do build/quality-gate).

## 2. Build matrix (autoridade canônica)

`build.yml` declara a matrix:

```yaml
matrix:
  locale: [pt-BR, it-IT, en, es-ES]
  include:
    - locale: pt-BR;  build_suffix: br; site_url: https://forjadesistemas.com.br; contact_email: contato@forjadesistemas.com.br
    - locale: it-IT;  build_suffix: it; site_url: https://systemforge.it;          contact_email: contatto@systemforge.it
    - locale: en;     build_suffix: en; site_url: https://systemforgesoftware.com; contact_email: contact@systemforgesoftware.com
    - locale: es-ES;  build_suffix: es; site_url: https://systemforge.es;          contact_email: hola@systemforge.es
```

- `fail-fast: false` é mandatório: se IT quebra, BR/EN/ES ainda publicam.
- Cada build job recebe `NEXT_PUBLIC_LOCALE`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_CONTACT_EMAIL` distintos. Artefatos saem nomeados como
  `build-{locale}` (com hyphen completo: `build-pt-BR`, não `build-br`).
- Deploy lê artefato via `build-{matrix.locale}` literal e gera `.htaccess` via
  `--locale={build_suffix}`. Os dois domínios (locale completo vs suffix curto)
  coexistem deliberadamente. Não tente unificar — quebra a invariante.

## 3. Isolamento por build (zero cross-contamination)

- Cada build job é `runs-on: ubuntu-latest` isolado. Cache de `node_modules` e
  `.velite` é compartilhado por hash de `package-lock.json` (não por locale).
- O conteúdo MDX por locale fica em `content/{locale}/blog/`; o build com
  `NEXT_PUBLIC_LOCALE=pt-BR` deve ler **apenas** `content/pt-BR/`. Se aparecer
  HTML/asset de outro locale no `out/` do build pt-BR, isso é cross-contamination.
- `build-isolation-check` (job pós-build em `build.yml`) baixa os 4 artefatos
  e roda `scripts/check-build-isolation.ts` que valida zero cross-locale leak.
  Hoje roda com `continue-on-error: true` enquanto i18n routing está
  incompleto, mas o gate é canônico — não remover o job.

## 4. Hreflang reciprocity (regra de SEO)

Cada artigo do blog declara `hreflang_pair` no frontmatter:

```yaml
hreflang_pair:
  - locale: 'it-IT'
    slug: 'ab-test-landing-page-guida-tecnica'
  - locale: 'en'
    slug: 'ab-test-landing-pages-technical-guide'
  - locale: 'es-ES'
    slug: 'ab-test-landing-pages-guia-tecnico'
```

Schema (`src/lib/blog/post-schema.ts`) enforça:
- **No self-reference**: artigo `pt-BR` não pode declarar `pt-BR` em pair.
- **No duplicates**: cada locale aparece no máximo 1 vez no array.
- **Exclusivo com `exclusive: true`**: artigos exclusivos de um mercado **não**
  podem ter hreflang_pair (lança erro de Zod).

**Escopo do Zod (importante):** o schema valida **shape** do frontmatter de **um
único artigo** (formato, não-self, não-dup, mutex com `exclusive`). Não enforça
reciprocidade entre arquivos. A reciprocidade — se artigo pt-BR mapeia para
slug `X` em it-IT, então `content/it-IT/blog/X.mdx` precisa existir E declarar
pt-BR ↔ slug do BR — é responsabilidade dos **scripts** downstream:
- `scripts/promote-from-stockpile.ts` cria o cluster inteiro de uma vez
  (sub-criando todos os locales antes de marcar `promoted`).
- `scripts/hreflang-validator.ts` é o validador **canônico** de reciprocidade
  entre artigos do blog (existência do alvo + reciprocidade bidirecional).
  **Não confundir com `scripts/check-content-parity.ts`**, que valida só os
  10 JSONs de `content/{locale}/pages/` (40 arquivos no total) e paridade de
  IDs em `portfolio.json`/`services.json` — não toca blog MDX.
- `.claude/blog/data/hreflang-map-*.json` é a fonte materializada usada pelo
  build (Velite injeta no `<head>`).

Drift entre as 3 fontes (frontmatter, hreflang-validator, hreflang-map) = blocker.

`scripts/check-content-parity.ts` roda no quality-gate (40 arquivos × 4 locales)
e barra merge se parity quebrar.

## 5. Compliance per-locale (CSP e GTM)

Distinção crítica que **não pode flutuar**:

| Jurisdição | GTM/GA4 permitido sem consent prévio? | Implicação no `.htaccess`/CSP |
|---|---|---|
| LGPD (BR) | Sim — interpretação atual permite analytics com aviso | CSP **deve** conter `googletagmanager` |
| GDPR (IT, ES) | Não — sem consent explícito não pode | CSP **não pode** conter `googletagmanager` |
| CAN-SPAM/CCPA (EN) | Sim — opt-out, não opt-in | CSP **deve** conter `googletagmanager` |

`scripts/generate-htaccess.ts --locale={br|it|en|es}` produz `.htaccess`
correto por locale. O deploy step `Verify security headers in .htaccess`
faz greps obrigatórios:

```bash
# Todos os 4 locales:
grep -q "Strict-Transport-Security" out/.htaccess || exit 1
grep -q "X-Frame-Options"            out/.htaccess || exit 1
grep -q "Content-Security-Policy"    out/.htaccess || exit 1

# Locale-specific (GTM):
# BR e EN — exige GTM no CSP:
grep -q  "googletagmanager" out/.htaccess || exit 1
# IT e ES — exige GTM AUSENTE do CSP:
! grep -q "googletagmanager" out/.htaccess || exit 1
```

Se o gate verde do quad-market passar com IT ou ES contendo `googletagmanager`,
**isso é exposição regulatória** (GDPR pode aplicar multa de até 4% do
faturamento global). Tratar como blocker absoluto.

## 6. Deploy isolation (SFTP + Cloudflare)

- 4 jobs paralelos em `deploy.yml`. Cada um:
  1. Sparse checkout só de `scripts/generate-htaccess.ts` + `package*.json`
     + `tsconfig.json` (não traz o repo inteiro — economia de IO).
  2. `actions/download-artifact@v4` com `run-id` resolvido por fallback
     `${{ github.event.workflow_run.id || inputs.build_run_id }}` (ver
     `auto-publishable-blog.md` §4.1 / §5).
  3. `sshpass` + SFTP em 5 sessions paralelas (5× speedup). `find -type d`
     primeiro para `-mkdir`, depois `find -type f` em chunks de 5.
  4. Purge Cloudflare por zona — uma chamada por mercado, **não** purga global.
- `concurrency: deploy-${{ github.ref }}`, `cancel-in-progress: true`. Se o
  promote bot disparar 2 deploys em janela curta, o segundo cancela o primeiro
  no meio. Isso é deliberado — alternativa seria upload duplicado e race em
  SFTP `put`.

## 7. Secrets multi-domain (não misturar)

- 4×5 = 20 segredos SFTP (`SFTP_{BR,IT,EN,ES}_{HOST,USER,PASS,PORT,PUBLIC_HTML}`).
- 4 zonas Cloudflare (`CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ZONE_ID_IT`,
  `CLOUDFLARE_ZONE_ID_EN`, `CLOUDFLARE_ZONE_ID_ES`) + 1 token API compartilhado.
- 4 Newsletter Workers. **Naming inconsistente — tech-debt P2:**
  - `config/sites/*.ts` lê `process.env.NEXT_PUBLIC_NEWSLETTER_WORKER_URL_{BR,IT,EN,ES}`
    (prefixo `NEXT_PUBLIC_` obrigatório porque é leitura runtime no client).
  - `.github/workflows/deploy.yml:492-495` lê o secret server-side
    `NEWSLETTER_WORKER_URL_{BR,IT,EN,ES}` (sem `NEXT_PUBLIC_`) no smoke pós-deploy.
  - `.github/workflows/build.yml` **não** referencia Newsletter Worker URL —
    o build estático não precisa do worker em build-time (consumo é client-side).
  - Risco: secret renomeado num lugar passa verde no outro. Padronizar como
    `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_X` (com alias sem prefixo apenas para
    steps server-side de CI) no próximo refactor.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_BUDGET_ENGINE_URL` são
  globais (sem sufixo) — todos os 4 builds compartilham o mesmo ID GA4 e a
  mesma URL do quote-engine externo.

Regra de ouro: se o secret tem efeito específico em **um** domínio, ele tem
sufixo. Se tem efeito cross-domain, não tem sufixo. Adicionar secret novo sem
seguir a convenção quebra a `quality-gate.yml` (tsc por locale com placeholders).

## 8. Site configs (`config/sites/{locale}.ts`)

Estrutura por locale: `SiteConfig` é declarado em `config/types.ts` e
re-exportado por `config/sites/types.ts` (apenas barrel de tipos, sem lógica).
Campos: `locale`, `htmlLang`, `ogLocale`, `siteName`, `domain`, `url`,
`tagline`, `description`, `author`, `email`, `whatsapp`, `calendly`,
`budgetEngine`, `address`, `compliance`, `currency`, `socialLinks`,
`navigation`, `seo`, `routes`, `newsletter`, `newsletterApiUrl`,
`ga4MeasurementId`.

`routes` é locale-specific (ex: BR `/servicos`, IT `/servizi`, EN `/services`,
ES `/servicios`). Não tentar unificar nomes de rota — quebra SEO local e
expectativa do usuário (urls localizadas têm CTR superior).

**Onde vive cada coisa (estrutura real):**
- `config/types.ts` — tipos canônicos (`SiteConfig`, `ComplianceFramework`, etc).
- `config/sites/types.ts` — barrel **só de tipos** (re-export de `config/types.ts`).
- `config/sites/{br,it,en,es}.ts` — 4 instâncias de `SiteConfig`.
- `config/sites/index.ts` — barrel de **valores**, hoje exporta `brConfig`,
  `itConfig`, `enConfig`. **Não exporta `esConfig`** (P2). Quem precisar
  importar estaticamente o ES tem que ir direto em `@/config/sites/es`.
- `src/lib/i18n.ts` — `getSiteConfig(locale)` (linhas 72-84) faz lookup por
  locale e importa `esConfig` direto (`src/lib/i18n.ts:17`). Esse é o entry-point
  canônico em runtime; `config/sites/index.ts` é apenas conveniência para
  imports estáticos pontuais.

## 9. Quality Gate cross-locale (push em `main`)

`quality-gate.yml` (chama `tsc --noEmit` 4×, ESLint, content-parity,
frontmatter 4×). Pré-requisitos:
- Cada build tsc roda com placeholders (`G-PLACEHOLDER`, `+5541999999999`
  para BR etc.) — não pede secret real porque tsc não executa runtime.
- `npx velite build` é pré-requisito (gera tipos `.velite/index.d.ts`).
- `scripts/check-content-parity.ts` valida **10 JSONs de
  `content/{locale}/pages/` × 4 locales = 40 arquivos** + paridade de IDs em
  `portfolio.json` e `services.json`. **Não toca blog MDX**. Logs internos
  ainda dizem "10 × 3 locales / 30 arquivos" (mensagem stale; tech-debt P2).
- Reciprocidade de `hreflang_pair` é validada por
  `scripts/hreflang-validator.ts` — workflow ou script separado, **não**
  pelo `check-content-parity.ts`.

## 10. Anti-padrões bloqueantes

| Sintoma | Impacto | Como evitar |
|---|---|---|
| Conteúdo de um locale referenciando rota de outro locale | Link 404 em produção, SEO degradado | Usar sempre `config.routes.X` do `SiteConfig` do **locale do artigo**, nunca hardcode. |
| Mesmo número WhatsApp em todos os locales | Cliente brasileiro recebido por humano em horário europeu, ou vice-versa | Sempre `NEXT_PUBLIC_WHATSAPP_NUMBER_{BR,IT,EN,ES}` per-locale. |
| Adicionar GTM/GA4 dinâmico em IT ou ES sem consent-manager | Violação GDPR potencial | Honrar §5; CSP enforcement no `.htaccess` é blocking. |
| Renomear `build-{locale}` para `build-{suffix}` no upload | Download-artifact no deploy quebra (espera locale completo) | Não tocar nomenclatura sem atualizar `deploy.yml` em sincronia. |
| Adicionar locale novo sem updating das 5 frentes (build matrix, deploy job, secrets, smoke-test, config/sites/) | Build verde, mas mercado novo invisível | PR de novo locale toca os 5 lugares juntos. Sem exceções. |
| Cloudflare API token único usado com **múltiplas zonas em uma única chamada `purge_everything`** | Purga global indesejada (afeta outros sites do mesmo account) | Sempre 1 chamada por `ZONE_ID`, como o deploy já faz. |
| `npm ci` faltando antes de `npx tsx` em workflow novo | Drift entre lockfile e runtime, instala versão errada do Velite | Sempre `npm ci` antes de qualquer script TS no CI. |
| Conteúdo escrito em locale errado (artigo pt-BR salvo em `content/it-IT/blog/`) | Frontmatter passa schema (locale field), mas hreflang_pair quebra parity | `validate-frontmatter.ts` confere `locale` field contra path; parity adicional. |

## 11. Tech-debt aberto multi-domain

Severity tags: **[P0]** breakage real em produção · **[P1]** bug ativo mas
contornável · **[P2]** stale naming sem impacto funcional · **[P3]** higiene.

- **[P0] ES WhatsApp fallback duplicado:** `config/sites/es.ts:21` usa
  `+393508751885` (mesmo número de IT). Build sem env seta = cliente espanhol
  cai no número italiano. Vide §1.
- **[P0] EN email hardcoded divergente:** `config/sites/en.ts:20` hardcoda
  `hello@systemforgesoftware.com`, ignorando env e divergindo do
  `contact@systemforgesoftware.com` declarado na matrix `build.yml`. Vide §1.
- **[P0] ~13.4k internal broken links** (i18n routing incompleto, configs IT/EN
  apontando para slugs PT). Resolução exige feature dedicada (route aliases +
  content reconciliation). Vide `PENDING-ACTIONS.md`.
- **[P1] WhatsApp env sem sufixo no CI:** `build.yml:123` exporta
  `NEXT_PUBLIC_WHATSAPP_NUMBER` (sem sufixo de locale) para todos os 4 jobs da
  matrix. Em CI o fallback per-locale do `.ts` é o que vale — secret declarado
  no GitHub Actions é silenciosamente ignorado. Vide §1.
- **[P1] `smoke-test.yml` legacy naming:** referencia
  `workflows: ["Triple Market Deploy"]` (deploy real é "Quad Market Deploy")
  e **não tem job `smoke-es`** (só BR/IT/EN). Smoke nunca dispara via
  workflow_run hoje, e mesmo se disparasse, ES não seria coberto. Vide
  `auto-publishable-blog.md` §6.
- **[P2] Naming "Triple Market" stale em vários lugares:**
  - `.github/workflows/build.yml` (comentários falam em "3 deploys")
  - `config/sites/types.ts` (algum comentário/enum legado)
  - `package.json#description` ou similar (auditar).
  Stale naming = onboarding confuso e busca grep produz false positives.
- **[P2] Newsletter Worker URL naming inconsistente** (`NEXT_PUBLIC_*` em
  config vs sem prefixo em deploy.yml). Vide §7.
- **[P2] `config/sites/index.ts` sem export de `esConfig`** no barrel. Funciona
  via lookup dinâmico no `getSiteConfig`, mas imports estáticos quebram.
- **[P3] Hreflang map JSON datado** (`.claude/blog/data/hreflang-map-YYYY-MM-DD.json`)
  é histórico: vários por dia em abril/maio. Consolidar em fonte única
  versionada (uma cópia + diff via git) reduz drift e custo de storage.
- **[P3] Address per-locale:** BR declara "Curitiba/PR, Brasil"; IT/EN/ES
  devem ter endereço local correspondente. Conferir `config/sites/{it,en,es}.ts`
  para paridade — impacta SEO local e LocalBusiness schema.

## 12. Checklist operacional (validação multi-domain)

Comandos de smoke-test que **não exigem GH Actions** — rodar local antes de
push grande:

```bash
# 1. Auditoria de secrets configurados no repo
gh secret list -R Pedrocorgnati/system-forge-landing-page | sort

# 2. Probe HTTP de produção (todos os 4 domínios em paralelo)
for url in https://forjadesistemas.com.br \
           https://systemforge.it \
           https://systemforgesoftware.com \
           https://systemforge.es; do
  echo "=== $url ==="
  curl -sI "$url" | head -5
  curl -sI "$url/blog/" | head -3
done

# 3. Verificar fallbacks duplicados de WhatsApp
grep -h "NEXT_PUBLIC_WHATSAPP_NUMBER_" config/sites/*.ts | sort -u

# 4. Conferir paridade de content por locale (esperado: 40 por locale)
for loc in pt-BR it-IT en es-ES; do
  echo "$loc: $(find content/$loc/blog -name '*.mdx' 2>/dev/null | wc -l)"
done

# 5. Gerar .htaccess per-locale (sem --check; o script só aceita --locale= ou --all)
for loc in br it en es; do
  npx tsx scripts/generate-htaccess.ts --locale=$loc
done

# 6a. Paridade de pages JSON (10 × 4 = 40 arquivos)
npx tsx scripts/check-content-parity.ts

# 6b. Reciprocidade de hreflang_pair no blog (validador separado e correto)
npx tsx scripts/hreflang-validator.ts

# 7. Lint do barrel config/sites (hoje 3 re-exports; esperado 4 quando ES for incluído)
grep -c "^export" config/sites/index.ts  # atual: 3 — esConfig fora
```

### Adicionando um 5º locale — checklist obrigatório (5 frentes)

Não é negociável. PR que ignora qualquer um dos pontos abaixo será revertido:

1. **`build.yml` matrix:** novo `locale`, `build_suffix`, `site_url`,
   `contact_email`, env vars NEXT_PUBLIC_*.
2. **`deploy.yml`:** novo job `deploy-{suffix}` com sparse-checkout,
   download-artifact, sftp parallel, cloudflare purge, CSP enforce.
3. **GitHub Secrets:** `SFTP_{SUFFIX}_{HOST,USER,PASS,PORT,PUBLIC_HTML}`,
   `CLOUDFLARE_ZONE_ID_{SUFFIX}`, `NEWSLETTER_WORKER_URL_{SUFFIX}` (e
   `NEXT_PUBLIC_NEWSLETTER_WORKER_URL_{SUFFIX}` se aplicável).
4. **`smoke-test.yml`:** novo job `smoke-{suffix}` + atualizar nome do
   workflow alvo (`Quad → Pent Market Deploy` ou equivalente).
5. **`config/sites/`:** novo `{locale}.ts` (espelhando estrutura), re-export
   no `index.ts`, **e** adicionar à `SupportedLocaleSchema` em
   `src/lib/blog/post-schema.ts` (Zod `z.enum([...])`).

Esquecer (5) faz Zod rejeitar todo frontmatter do novo locale silenciosamente
no quality-gate (failure mode comum em mercado novo: validações verdes mas
nenhum artigo passa parity).

Ver `commit-multilanguage.md` para regras de commit cross-locale e
`auto-publishable-blog.md` para o pipeline de publicação automática.
