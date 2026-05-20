# auto-publishable-blog — Contrato do pipeline de publicação automática

Última revisão: 2026-05-19 (auditoria end-to-end — sincronizado com o estado
real do repositório; ver "Histórico de revisão" no fim).

Pipeline ponta-a-ponta que entrega artigos novos em produção sem mão humana
após o stockpile estar populado. Quem altera qualquer elo abaixo é responsável
por revalidar a cadeia inteira no domínio público.

O pipeline tem **2 pontos estruturalmente silenciosos** de falha, ambos
contornados por design e documentados nas seções 3.2 e 4.1:

1. Pushes feitos com `GITHUB_TOKEN` **não disparam** outros workflows
   (anti-loop do GitHub Actions) — exige `gh workflow run` explícito.
2. `actions/download-artifact@v4` exige `run-id` quando o caller não é o
   `workflow_run` natural — exige forward do `build_run_id`.

## 1. Topologia real (4 elos obrigatórios)

```
[1] Stockpile gerador → [2] cron promote-from-stockpile.yml (13h UTC)
   → [3] Quad Market Build (4 locales) → [4] Quad Market Deploy (4 SFTP)
       └── inclui job in-line `post-deploy-smoke` (smoke dos 4 domínios)
```

Quebra em [1]..[4] = publicação automática parada. O Quality Gate em
`quality-gate.yml` corre em paralelo a [3] e bloqueia push se TS/ESLint/
parity/frontmatter falharem.

**Não existe um "5º elo".** O smoke pós-deploy é o job `post-deploy-smoke`
declarado dentro do próprio `deploy.yml` (ver §5). Um workflow separado
`smoke-test.yml` existiu no passado mas **foi removido do repositório** — não
há workflow legado a manter. Qualquer referência a `smoke-test.yml` em docs ou
comentários é resíduo histórico e deve ser apagada.

## 2. Elo 1 — Stockpile (origem)

- Local: `.claude/blog/data/stockpile/packages/{uuid}/`
- Cada pacote: `package.json` (metadata) + um diretório por locale com
  `reviewed.md` (frontmatter + corpo).
- Estados (`promotion_state`): `draft → reviewed → available → promoted` (+
  `invalidated` quando o gerador detecta dependency drift).
- Schema canônico do MDX final: `src/lib/blog/post-schema.ts`
  (`PostFrontmatterSchema`, Zod). É a **fonte da verdade** — ver §7.1.
- Diretório de pacote **sem `package.json`** é tratado como órfão: `loadPackages()`
  emite `console.warn("[promote] skip <uuid>: diretorio sem package.json (orfao)")`
  e o ignora. Órfãos não são promovíveis — investigar/limpar manualmente.

**Campo crítico**: `excerpt` é **obrigatório** (`z.string` min 50, max 300). O
gerador histórico emitia `description` mas não `excerpt`. O compat shim em
`scripts/promote-from-stockpile.ts` (passo 5) faz **insert** (não replace): se
`excerpt` ausente e `description` presente, copia o valor em memória
(`parsed.data.excerpt = parsed.data.description`), valida o Zod sobre o
`parsed.data` em memória, e **só depois** insere a linha `excerpt:` no raw
imediatamente após a linha `description:` via
`raw.replace(/^(description:[^\n]*\n)/m, ...)`. A linha `description:` original
é preservada. Se a regex não casar (frontmatter multilinha ou sem
`description:`), o pacote é skipado com warn. Não trunca — se `description`
>300 chars, o Zod rejeita antes do splice e o pacote é skipado (preferível a
corromper SEO).

> Nota: 40 posts históricos (10 por locale, os artigos-semente) usam
> frontmatter em **formato JSON** (`---\n{ ... }\n---`) e já trazem `excerpt`.
> Auditorias de frontmatter devem parsear JSON **e** YAML — um regex YAML puro
> gera falsos positivos de "excerpt ausente".

Outras regras de frontmatter (do schema):
- `slug` regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `title` 1–120 chars
- `tags` 1–10 strings, cada uma não-vazia
- `hreflang_pair`: array de `{locale, slug}`. **Sem self-reference. Sem dupes.
  Mutuamente exclusivo com `exclusive=true`** (validado por `superRefine`).
- `date` auto-fill: `date || publishedAt || today UTC`.

## 3. Elo 2 — `promote-from-stockpile.yml` (gate de promoção)

- Trigger: `schedule: '0 13 * * *'` (13h UTC) + `workflow_dispatch`.
- Concorrência: `group: promote-from-stockpile`, `cancel-in-progress: false`
  (não cancela run em andamento; evita meio-commit).
- Permissões: `contents: write` (push) + `actions: write` (dispatch do build)
  + `issues: write` (auto-issue em falha — ver §3.3).
- Timeout: 15 min.

Steps do job `promote` (ordem real):
1. `actions/checkout` (`fetch-depth: 0`) → `setup-node` → `npm ci`.
2. Step `Promote`: `npx tsx scripts/promote-from-stockpile.ts` com
   `MAX_PER_LOCALE=3`. **Este script faz tudo, inclusive o commit + push.**
3. Step `Dispatch Quad Market Build` — ver §3.2.
4. Step `Abrir issue em caso de falha` (`if: failure()`) — ver §3.3.

Passos internos do script TS (ordem em que o código executa):
- acquire lock TTL 30 min (`.run-lock.json` em `.claude/blog/data/stockpile/`).
- load packages → filter eligible
  (`promotion_state==available` && fresh && !invalidated).
- **sort FIFO** por `lifecycle.created_at` (ISO 8601, ordenável
  lexicograficamente), com `equivalence_id` como desempate determinístico.
  Pacote mais antigo promovido primeiro — evita inanição de pacotes "velhos".
- para cada locale, itera pelo array ordenado e pega os primeiros que casam
  `locales_present` + têm `reviewed.md`, até `MAX_PER_LOCALE`.
- parse frontmatter (gray-matter) → **se `excerpt` ausente, injeta em
  `parsed.data` a partir de `description`** → `PostFrontmatterSchema.safeParse`.
  Se falha, loga `[promote] skip <eq_id>/<locale>: <issues>` e continua.
- **compila o corpo MDX** (guard anti-build-quebrado — ver §3.4). Se não
  compila, loga `[promote] skip <eq_id>/<locale>: MDX nao compila — <erro>` e
  continua. Frontmatter válido + MDX quebrado não passa.
- check slug-collision (`fs.existsSync(target)` → warn + skip se já existe).
- **só agora** faz o splice regex no `raw` original (insert de `excerpt:` após
  `description:`). Validação opera sobre `parsed.data` em memória, não sobre o
  raw mutado.
- escrever `.mdx` com flag `'wx'` (exclusive create, anti-TOCTOU).
- marcar `promotion_state='promoted'` + `lifecycle.promoted_at=now` no
  `package.json` (uma vez por pacote, mesmo com múltiplos locales).
- git config `github-actions[bot]` → `git add -- <pathspecs explícitos>`
  (**nunca** `-A`) → `git commit` → `git pull --rebase --autostash origin main`
  → `git push origin HEAD:main`.
- release lock (try/finally — sempre, mesmo em erro).

Se o `git push` do script falhar, `execSync` lança, o script sai com código
!= 0, o step `Promote` falha e **o job aborta** — os steps de dispatch e
auto-issue de sucesso não rodam (o de falha sim). Não há janela de "push
mascarado".

> O lock cooperativo `.claude/blog/data/stockpile/.run-lock.json` está
> **gitignored** (`.gitignore:74`) e **não é versionado** — é estado local
> efêmero. O mesmo vale para `packages/*/.lock.json` (`.gitignore:75`). O
> `pull --rebase --autostash` permanece como defense-in-depth contra working
> tree sujo por outra automação no mesmo runner.

### 3.1. DRY_RUN

`DRY_RUN=1` pula `mkdirSync`, `writeFileSync` do mdx, `writeFileSync` do
package.json, e todos os comandos git (config/add/commit/pull/push). Útil para
smoke local sem mutar nada. O guard de compilação MDX (§3.4) **roda mesmo em
DRY_RUN** — é validação, não mutação.

### 3.2. Dispatch do build

Após o script TS já ter feito o `git push`, o workflow tem o step:

```yaml
- name: Dispatch Quad Market Build (apenas se houve promote commit)
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    if git log -1 --format=%s | grep -q "^content(multilanguage): promote daily batch"; then
      gh workflow run build.yml --ref main
    else
      echo "Sem promote commit - skip dispatch"
    fi
```

**Por que o dispatch existe**: pushes feitos com `GITHUB_TOKEN` não disparam
outros workflows (anti-loop do GitHub Actions). Sem dispatch explícito,
`build.yml` (que tem `on.push` em `main`) ignoraria o commit do bot.

**Por que o `git log -1` local é confiável aqui**: este step só executa se o
step `Promote` teve sucesso. Sucesso do `Promote` ⇒ o `git push` interno do
script aterrou em `origin/main` ⇒ o promote commit está no remoto. A working
tree do runner não é mutada entre o push do script e este `git log`. O grep do
prefixo `content(multilanguage): promote daily batch` isola dispatch só quando
houve commit real do promote (no-op runs não disparam).

> O step redundante `Push` que existia aqui (o script TS já fazia o push) foi
> **removido**. Ele rodava `git push origin main || echo "no commit (no-op)"`
> com identidade de bot divergente e mascarava falhas reais de push — era
> tech-debt, não fallback.

### 3.3. Auto-issue em falha

O step `Abrir issue em caso de falha` (`if: failure()`,
`actions/github-script@v7`) abre uma issue no próprio repo com label
`promote-failure` contendo link do run, trigger e SHA. Se já houver uma issue
aberta com esse label, **comenta** nela em vez de criar duplicata. Falhas do
cron agora são visíveis sem depender de `gh run list`.

### 3.4. Guard de compilação MDX (anti-build-quebrado)

Frontmatter válido **não** garante MDX compilável. O corpo do artigo é MDX: um
`<` seguido de dígito (`<500 reais`) é lido como abertura de tag JSX e quebra o
parser; um `{...}` cru no texto é lido como expressão JS e falha no acorn. Com o
Velite agora em **strict mode** (§7.1), um único post assim **aborta o build dos
4 mercados** — não é mais drop silencioso.

Por isso o passo 5 do script, **após** a validação de schema, compila o corpo
MDX antes de promover. A compilação real roda em `scripts/check-mdx.mjs`
(`@mdx-js/mdx` `compileSync` + `remark-gfm`), invocado como **subprocesso
`node`** pelo `mdxBodyCompiles()` do script TS.

> Por que subprocesso e não import direto: `@mdx-js/mdx` puxa
> `estree-walker@3` (ESM-only, sem condição `require` no `exports`). O resolver
> do `tsx` 4.x — runtime do `promote-from-stockpile.ts` no CI — não resolve esse
> pacote (`ERR_PACKAGE_PATH_NOT_EXPORTED`) e o script inteiro morre no import.
> `node` puro resolve sem problema. Isolar a cadeia de import num processo
> `node` separado é o contorno. **Não reverter `mdxBodyCompiles` para
> `import { compileSync }`** — quebra o script sob tsx.

Post com MDX inválido é skipado com
`[promote] skip <eq_id>/<locale>: MDX nao compila — <erro>` e o ciclo continua
com os demais. Zero Silêncio: o drift é detectado **antes** do commit em `main`,
não num build vermelho horas depois.

`check-mdx.mjs` distingue dois exit codes: **3** = MDX genuinamente não compila
(post quebrado, skipável); **qualquer outro != 0** = falha de infraestrutura do
próprio checker (`@mdx-js/mdx` não instalado, helper ausente, `node` ausente).
Falha de infra **não** é tratada como post quebrado — `mdxBodyCompiles()` lança,
o run **aborta** e o auto-issue (§3.3) dispara. Sem essa distinção, um checker
quebrado skiparia 100% dos posts e o promote viraria um no-op silencioso que
para a publicação inteira sem ninguém ver.

## 4. Elo 3 — `build.yml` (Quad Market Build)

- Triggers reais: `push` em `main` (paths-ignore exclui `docs/**`, `*.md`,
  `.agents/**`, `.claude/**`, `CHANGELOG*`) + `pull_request` em `main` +
  `workflow_dispatch`. **Não há trigger `workflow_run`** — quem chama `build.yml`
  é (a) push direto ou (b) `gh workflow run build.yml` (do promote bot, §3.2).
- Matrix 4 locales (pt-BR, it-IT, en, es-ES), `fail-fast: false` (um locale
  quebrado não para os outros 3).
- Cache: `node_modules + .velite` por `package-lock.json`; `.next/cache` por
  hash de fonte.
- Steps relevantes: `Check content parity` (só pt-BR) → `Validate frontmatter`
  (hard-fail por locale via `npm run prebuild:{suffix}`) → `Optimize images` →
  `Build content & search index` → `Build` (Next.js static export para `out/`)
  → `Upload artifact build-{locale}`.
- Post-build: `build-isolation-check` (cross-contamination zero) + `Check broken
  links --internal-only` (`continue-on-error` — ver §10 [P3]).

### 4.1. Dispatch do deploy

Job `dispatch-deploy` ao final do build:

```yaml
dispatch-deploy:
  needs: build
  if: ${{ github.event_name == 'workflow_dispatch' && success() }}
  permissions:
    actions: write
  steps:
    - run: |
        gh workflow run deploy.yml --ref main --repo ${{ github.repository }} \
          -f build_run_id=${{ github.run_id }}
```

**Por que existe**: quando o build é disparado por `workflow_dispatch` (vindo
do promote bot, §3.2), o `workflow_run` em `deploy.yml` não dispara — mesma
regra do `GITHUB_TOKEN`. Além disso, `actions/download-artifact@v4` exige
`run-id` quando o caller não é o `workflow_run` natural; por isso o
`build_run_id` é forwarded e usado nos 4 `download-artifact` do deploy via
fallback `${{ github.event.workflow_run.id || inputs.build_run_id }}`.

**Caminhos de trigger do deploy (não há duplicação real)**: `deploy.yml`
declara **ambos** `workflow_run: ["Quad Market Build"]` **e**
`workflow_dispatch`. Os dois caminhos são mutuamente exclusivos na prática:
- **Push humano direto em `main`** → build (event `push`) → `dispatch-deploy`
  **não** roda (gate `if: github.event_name == 'workflow_dispatch'`) → deploy
  dispara só via `workflow_run`. Um deploy.
- **Promote bot** → `gh workflow run build.yml` (event `workflow_dispatch`) →
  `dispatch-deploy` roda → deploy dispara via `gh workflow run`. O
  `workflow_run` não dispara (build veio de `GITHUB_TOKEN`). Um deploy.

O desenho é correto mas frágil: se o gate `if` de `dispatch-deploy` for
relaxado, o deploy pode rodar 2×. Como `deploy.yml` usa
`cancel-in-progress: false` (§5), uma eventual duplicação **enfileira** em vez
de cancelar mid-upload — degrada para "deploy a mais", não para release
parcial. Invariante a preservar: **não relaxar o gate sem revisar §5**.

## 5. Elo 4 — `deploy.yml` (Quad Market Deploy)

- 4 jobs paralelos: `deploy-br`, `deploy-it`, `deploy-en`, `deploy-es`.
- Cada job: checkout sparse só de `scripts/generate-htaccess.ts` (+ `package*`,
  `tsconfig`) → download-artifact `build-{locale}` → gerar `.htaccess` por
  locale → verificar headers (HSTS, X-Frame-Options, CSP, e GTM
  presença/ausência conforme jurisdição — ver `multi-domain-rules.md`) →
  upload SFTP em 5 sessões paralelas via `sshpass` → purge Cloudflare por zona.
- Concorrência: `group: deploy-${{ github.ref }}`, **`cancel-in-progress: false`**
  — deploys do mesmo branch **enfileiram**, não se cancelam. Isto resolve o bug
  histórico de SFTP em estado parcial quando um segundo push chegava no meio do
  upload. O próprio `deploy.yml` documenta a razão em comentário.
- `workflow_dispatch` tem **um único input**: `build_run_id` (opcional). Não há
  input `market` — re-deploy manual sempre cobre os 4 mercados.
- Post-deploy: job `post-deploy-smoke` com
  `needs: [deploy-br, deploy-it, deploy-en, deploy-es]` e `if: always() &&`
  todos os 4 deploys `== 'success'`. Espera 60 s de propagação CDN e roda, em
  sequência: `scripts/smoke-test-full.sh` (HTTP/lang/keyword/sitemap),
  `scripts/smoke-test-features.sh` (blog/contact/services) e
  `scripts/smoke-test-workers.sh` (newsletter Workers — só se os secrets
  `NEWSLETTER_WORKER_URL_*` estiverem setados). **Este é o smoke automático do
  pipeline.**

Segredos por mercado: `SFTP_{BR,IT,EN,ES}_{HOST,USER,PASS,PORT,PUBLIC_HTML}`,
`CLOUDFLARE_ZONE_ID[_{IT,EN,ES}]`, `CLOUDFLARE_API_TOKEN` (compartilhado),
`NEWSLETTER_WORKER_URL_{BR,IT,EN,ES}`. Documentação em `docs/ci-cd-secrets.md`.

**Timeout de cada job: 150 min.** O upload SFTP **re-envia todos os ~30k arquivos
do export estático a cada deploy** — não há skip incremental. Com o timeout
antigo de 60 min, o locale pt-BR (o maior — ~36k arquivos depois que a correção
do `relatedService` restaurou 210 posts antes dropados) **estourava o timeout
mid-upload** e o job era cancelado, deixando release parcial. EN também caía por
variância de rede. 150 min dá folga de ~2x sobre o tempo real (~67 min para BR).

**Risco residual (P1)**: o upload SFTP de cada job é em 5 sessões paralelas via
`sshpass`, **não atômico** e **sem incremental**. Se um job atingir o timeout ou
cair a rede no meio do upload, o servidor fica com estado parcial (alguns
arquivos novos, outros velhos). O `cancel-in-progress: false` elimina o
cenário de cancelamento por novo push, e o timeout de 150 min dá folga — mas o
mecanismo continua frágil porque re-sobe tudo toda vez. Hardening recomendado
(tech-debt §10): trocar o par `mkdir`-batch + `put`-loop por **`lftp mirror -R
--parallel=N`** (uma conexão, pipelined, cria diretórios implicitamente,
elimina a fase de `mkdir` de ~7 min) — **sem `--delete`** para não arriscar
remoções. Hardening ideal de atomicidade: deploy em diretório versionado +
symlink swap (`releases/{sha}/` + symlink `current`). Ver §10.

## 6. Invariantes inegociáveis

1. **Schema lockstep (§7.1)**: `src/lib/blog/post-schema.ts` é a fonte da
   verdade. `velite.config.ts` **espelha** as regras inline (não importa o
   módulo) — mudar um lado exige mudar o outro.
2. **Lock cooperativo**: `acquireRunLock` TTL 30 min. Dois cron concorrentes
   não rodam — o segundo aborta com exit 2 ("outra execucao detem o lock").
3. **Idempotência**: `promotion_state=promoted` é one-way; package só pode ser
   promovido uma vez. Slug-collision (arquivo já existe em
   `content/{locale}/blog/`) faz skip com warn, **não** sobrescreve.
4. **Atomicidade do write**: `writeFileSync(target, finalRaw, { flag: 'wx' })`
   falha se o destino já existir — defense-in-depth contra TOCTOU.
5. **Bot identity**: commit autor `github-actions[bot]` (configurado pelo
   script TS). É a única identidade — não há segundo `git config` no YAML.
6. **Pathspecs explícitos no `git add`**: nunca `-A` ou `.`. O bot pode estar
   com working tree poluído por outra automação no mesmo workspace.
7. **Trunk-Based**: ver `commit-multilanguage.md` §1. Cron nunca cria branch.
8. **Failure → issue**: tanto a routine `blog-daily` quanto o cron
   `promote-from-stockpile` abrem issue automática em falha (§3.3).
9. **Gate do `dispatch-deploy` é load-bearing**: não relaxar sem revisar §4.1.

## 7. Schema e validação

### 7.1. Lockstep do schema de frontmatter

`PostFrontmatterSchema` (Zod, `src/lib/blog/post-schema.ts`) é a fonte da
verdade. Consumidores:

| Consumidor | Como usa o schema |
|---|---|
| `scripts/promote-from-stockpile.ts` | **importa** `PostFrontmatterSchema` e valida cada `reviewed.md` antes de promover. |
| `scripts/validate-frontmatter.ts` | gate hard-fail no build (`npm run prebuild:{suffix}`); rejeita qualquer arquivo inválido. |
| `velite.config.ts` | **espelha** as regras inline com `s` (lib do Velite). Não importa o módulo Zod — `s` ≠ `z`. |

`velite.config.ts` foi alinhado para casar com o canônico nos campos
`title` (`min(1).max(120)`), `excerpt` (`min(50).max(300)`) e `tags`
(`array(string().min(1)).min(1).max(10)`). O Velite roda em **strict mode**
(`defineConfig({ strict: true })`): um doc que viola o schema **ou** cujo MDX
não compila **aborta o build** (exit != 0), em vez de ser dropado com warning.

Isto fecha a falha estrutural mais grave do pipeline: antes (modo não-estrito,
default do Velite) um post quebrado sumia silenciosamente do `.velite`, virava
404 em produção e o build continuava **verde**. `strict: true` transforma esse
drift silencioso em falha de CI ruidosa. A paridade de schema continua
importando: `validate-frontmatter` hard-fail corre **antes** do `velite build`
no CI e dá a mensagem de erro mais legível; o strict do Velite é a segunda
camada que pega o que escapar (inclusive erro de compilação MDX, que
`validate-frontmatter` não vê — esse é por sua vez pré-filtrado no promote, §3.4).

> Limitação conhecida e aceita: o Velite espelha os limites min/max mas **não**
> reproduz as regras cross-field do `superRefine` (exclusive vs `hreflang_pair`,
> self-reference, locales duplicados) nem a regex de slug idêntica. Essas regras
> são garantidas por `validate-frontmatter` (schema canônico) antes do Velite.
> Manter assim é deliberado — duplicar `superRefine` em `s` seria frágil.

### 7.2. rehype-sanitize está INERTE (decisão de arquitetura)

`velite.config.ts` declara um `sanitizeSchema` (allowlist de tags) e um bloco
`mdx: { rehypePlugins: [[rehypeSanitize, sanitizeSchema]] }` na collection. **Esse
bloco não roda.** `mdx` não é uma chave válida de `defineCollection` — o Velite a
ignora silenciosamente. A sanitização real só aconteceria se a config fosse
movida para `s.mdx({...})` no campo `content` ou para `defineConfig({ mdx })`.

A decisão é **manter inerte de propósito**, não consertar:

- O conteúdo do blog é gerado por um pipeline automatizado confiável (routine
  Claude + stockpile revisado), **não** por submissão pública. O threat model de
  XSS via MDX (T-001) não se aplica — não há input não-confiável.
- Ligar a sanitização **removeria** os `<script type="application/ld+json">`
  (JSON-LD de SEO) e os componentes `<FAQSchema>` / `<Callout>`, que são
  arquitetura intencional do blog. A allowlist teria de ser reescrita para
  permiti-los — o que esvazia o ganho de segurança.
- Flipar isso sobre ~1200 posts já publicados é alto risco por ganho nulo.

O `sanitizeSchema` e o bloco `mdx:` ficam no arquivo como **referência marcada
INERTE** (comentários explícitos no `velite.config.ts`), caso o blog um dia
aceite conteúdo de terceiros. Até lá, não são dead code acidental — são código
morto **documentado e deliberado**.

### 7.3. `relatedService` — normalização em vez de enum estrito

`relatedService` (frontmatter opcional, alimenta o CTA contextual do artigo —
`CTAContextual` → `ROUTES.SERVICE(relatedService)` → `/servicos/[slug]`) **deve**
resolver para um dos 13 valores canônicos de `ServiceCategory`. Mas o pipeline de
conteúdo (routine `blog-daily`) escreve esse campo livremente nos 4 locales, sem
validar. O resultado real: **~48 valores distintos**, a maioria não-canônica —
variantes pt/it/en/es de "custom systems", "web development", "business
automation", "system maintenance", "AI agents".

Falha estrutural que isso causou: o schema do Velite era
`relatedService: s.enum(serviceCategoryValues)`. Em modo não-estrito (o default
histórico), um post com `relatedService` fora do enum **falhava a validação de
schema inteira** e era **silenciosamente dropado** — em pt-BR, **210 de 379
posts** (55%) nunca chegavam ao `.velite`, viravam 404 em produção com build
verde. Ao ligar `strict: true` (§7.1) o mesmo enum passaria a **abortar o build**
— CI vermelho permanente até centenas de artigos serem reescritos.

Correção (camada de normalização, não enum estrito):

- **`src/lib/blog/normalize-service.ts`** — módulo sem dependência de framework
  (importável pelo Velite via caminho relativo e por app/scripts). Exporta
  `normalizeRelatedService(raw): ServiceCategory | undefined`: canoniza a forma
  textual (trim, lowercase, espaços/underscores → hífen), aceita valor já
  canônico, mapeia **sinônimos verdadeiros** via alias, e devolve `undefined`
  para clusters ambíguos.
- **`velite.config.ts`** — schema cru passa a `relatedService: s.string()`
  (aceita qualquer valor → nem aborta nem dropa); o `.transform()` chama
  `normalizeRelatedService()`. O tipo gerado vira `ServiceCategory | undefined`,
  casando com `Article.relatedService?: ServiceCategory`.
- **`post-schema.ts`** — campo adicionado como `z.string().optional()`
  (leniente; a normalização é downstream).
- **`validate-frontmatter.ts`** — emite **WARNING não-bloqueante** listando os
  valores não-canônicos e suas contagens, para dar visibilidade ao drift do
  pipeline sem travar o CI.

Decisão deliberada sobre os aliases: **só sinônimos verdadeiros** são mapeados
(variantes de mobile → `aplicativo-mobile`, de "automação IA"/"agentes IA" →
`automacao-com-ia`, de "consultoria técnica" → `consultoria`, `erp-pmi` →
`erp`). Clusters ambíguos ("sistemas-personalizados", "desenvolvimento-web",
"automação-empresarial", manutenção) caem em `undefined` de propósito: chutar um
`/servicos/[slug]` errado em centenas de artigos é pior que omitir o link
contextual — `undefined` degrada para o CTA padrão, que é totalmente funcional.

Prevenção na origem (tech-debt P3): a routine `blog-daily` deveria emitir slugs
canônicos de `ServiceCategory` direto, localizando apenas os rótulos de exibição.
Enquanto não o fizer, a camada de normalização absorve o drift sem regressão.

## 8. Modos manuais permitidos

- `gh workflow run promote-from-stockpile.yml --ref main` — força ciclo fora do
  horário do cron (útil para validar fix sem esperar 13h UTC).
- `gh workflow run build.yml --ref main` — força build completo, gera artefatos
  novos. Útil quando `dispatch-deploy` não rodou (bug raro).
- `gh workflow run deploy.yml --ref main -f build_run_id=<run_id>` — redeploy
  manual dos 4 mercados reaproveitando os artefatos de um build prévio. Sem
  `build_run_id`, o deploy depende de `workflow_run.id` (que é null num
  `workflow_dispatch`) e os `download-artifact` falham — **sempre passar
  `build_run_id` em dispatch manual**.
- `DRY_RUN=1 npx tsx scripts/promote-from-stockpile.ts` — smoke local sem mutar
  nada.

## 9. Tripwires comuns e diagnóstico

| Sintoma | Causa raiz provável | Diagnóstico imediato |
|---|---|---|
| Cron success mas no-op | Stockpile vazio/drenado, ou todo pacote skipado por schema | `gh run view <id> --log \| grep -E 'skip \|no-op'`. Se tudo skip por schema, auditar o compat shim de excerpt. |
| Promote commitou mas Build não disparou | Step `Dispatch` sem `actions: write`, ou prefixo de commit divergente | `gh run list --workflow=build.yml --branch=main --limit=5` — procurar run com event `workflow_dispatch`. |
| Build success mas Deploy não disparou | `dispatch-deploy` não rodou (build veio de push, não dispatch) e `workflow_run` em deploy.yml falhou, ou Cloudflare timeout | `gh run list --workflow=deploy.yml --limit=5` + log do `dispatch-deploy`. |
| Deploy: `Unable to download artifact(s): Not Found` | `run-id` null no caminho `workflow_dispatch` (`build_run_id` ausente/vazio) | Conferir que o dispatch manual passou `-f build_run_id=<id>`; no caminho bot, que `build.yml` forwarda `${{ github.run_id }}`. |
| `git push` non-fast-forward repetitivo | Outro commit aterrou no remoto entre commit e push | O script já faz `pull --rebase --autostash`; se persistir, rodar manualmente e repush. |
| Pacote some sem aparecer no log | Diretório de pacote sem `package.json` (órfão) | `gh run view <id> --log \| grep 'orfao'` — `loadPackages()` agora avisa. |
| Promote falhou e ninguém viu | — | Já não acontece: §3.3 abre issue com label `promote-failure`. |

## 10. Tech-debt aberto (severizado)

- **[P2] Deploy SFTP não-atômico**: upload em 5 sessões paralelas; timeout/queda
  de rede mid-upload deixa release parcial. `cancel-in-progress: false` já
  cobriu o cenário de cancelamento por novo push. Hardening restante: release
  versionada em diretório + symlink swap atômico.
- **[P3] Internal broken links** (~13.4k, i18n routing incompleto). Tech-debt
  em `PENDING-ACTIONS.md`. Não bloqueia publicação (`continue-on-error` no
  `Check broken links`).
- **[P3] Upstream stockpile generator**: gerar `excerpt` direto em vez de
  depender do compat shim splice. Remove superfície de breakage futura.
- **[P3] Dois diretórios de pacote órfãos** (`reviewed.md` sem `package.json`)
  em `.claude/blog/data/stockpile/packages/`. O `loadPackages()` agora os
  reporta via warn; decidir entre completar o `package.json` ou apagar os dirs.
- **[P3] `relatedService` não-canônico na origem**: a routine `blog-daily`
  escreve ~48 variantes do campo nos 4 locales. A camada de normalização (§7.3)
  absorve o drift, mas o fix de raiz é a routine emitir slugs canônicos de
  `ServiceCategory`. `validate-frontmatter` já reporta o drift via warning.

### Resolvido nesta auditoria (2026-05-19)

- ~~[P0] `.run-lock.json` tracked sem `.gitignore`~~ — gitignored
  (`.gitignore:74-75`), não versionado.
- ~~`smoke-test.yml` legado~~ — workflow removido do repo; smoke vive no job
  `post-deploy-smoke` de `deploy.yml`.
- ~~[P1] `cancel-in-progress: true` no deploy~~ — agora `false` (enfileira).
- ~~[P1] Push duplo + masking de erro no `promote-from-stockpile.yml`~~ — step
  `Push` redundante removido; push único feito pelo script TS.
- ~~[P1] Dispatch sobre commit fantasma~~ — sem o step `Push` mascarado, o
  `Dispatch` só roda após `Promote` com sucesso (§3.2).
- ~~[P2] "Triple Market" / "3 deploys" / "smoke-test.yml" em comentários~~ —
  corrigidos em `build.yml` e `deploy.yml`.
- ~~[P2] Ordenação dita "FIFO" mas lexicográfica~~ — agora FIFO real por
  `lifecycle.created_at`.
- ~~[P2] Velite schema sem `min(50)` no excerpt~~ — alinhado ao canônico.
- ~~Input `market` morto em `deploy.yml`~~ — removido (nunca era usado).
- ~~[P3] Sem auto-issue no cron promote~~ — implementado (§3.3).
- ~~[P0] Velite em modo não-estrito: post quebrado some sem quebrar o build~~ —
  `defineConfig({ strict: true })` (§7.1). Drift silencioso vira falha de CI.
- ~~[P0] 24 posts MDX quebrados em `content/{locale}/blog/`~~ — `<` antes de
  dígito/símbolo escapado para `&lt;` (19 arquivos); 5 blocos JSON-LD `en`
  envolvidos em template literal para compilar sob MDX. Todos os 4 locales
  compilam com 0 erros.
- ~~[P1] `<FAQSchema>` órfão: componente não passado ao MDX runtime~~ —
  `src/components/blog/MdxBlogComponents.tsx` exporta `FAQSchema` + `Callout`;
  `MDXContent.tsx` os injeta via prop `components`. Sem isso o post renderiza
  "Element type is invalid" em runtime.
- ~~[P1] Sem guard de compilação MDX no promote~~ — `mdxBodyCompiles()` via
  `scripts/check-mdx.mjs` (§3.4). Post que quebraria o build strict não é
  promovido.
- ~~[P0] `relatedService` enum dropava 210/379 posts pt-BR (55%) silenciosamente~~
  — schema cru vira `s.string()` + normalização no `.transform()` via
  `normalizeRelatedService()` (§7.3). Sob `strict: true` o enum teria abortado o
  build; a camada de normalização faz todos os 379 posts publicarem com o tipo
  ainda casando `Article.relatedService?: ServiceCategory`.

## 11. Apêndice operacional (comandos `gh` para triagem)

```bash
# 11.1. Último run do promote — sucesso ou falha
gh run list --workflow=promote-from-stockpile.yml --limit=5

# 11.2. Logs do último run (procurar "skip "/"orfao" para diagnóstico)
gh run view <run_id> --log | grep -E '(skip |orfao|OK:|no-op)'

# 11.3. Última cadeia Build → Deploy
gh run list --workflow=build.yml --limit=5
gh run list --workflow=deploy.yml --limit=5

# 11.4. Forçar 1 ciclo de promote (fora do cron)
gh workflow run promote-from-stockpile.yml --ref main

# 11.5. Inspecionar o lock cooperativo (arquivo local, gitignored)
cat .claude/blog/data/stockpile/.run-lock.json 2>/dev/null

# 11.6. Detectar lock órfão (TTL 30 min) — comparar acquired_at com now-30min
node -e 'const j=require("./.claude/blog/data/stockpile/.run-lock.json");const a=new Date(j.acquired_at);console.log({lock:j,stale:Date.now()-a.getTime()>30*60*1000})' 2>/dev/null

# 11.7. Liberar lock órfão (só após confirmar stale) — é arquivo local, basta rm
rm -f .claude/blog/data/stockpile/.run-lock.json

# 11.8. Invalidar um pacote (humano) — editar package.json do pacote:
#    "promotion_state": "invalidated"
#    "invalidation_reason": "<motivo curto>"
#  Depois: git add <pkg.json> && git commit -m "chore(blog): invalidate <uuid>"

# 11.9. Re-disparar Deploy reaproveitando artefato de um build
gh workflow run deploy.yml --ref main -f build_run_id=<build_run_id>

# 11.10. Probe HTTP nos 4 domínios após deploy
for url in https://forjadesistemas.com.br https://systemforge.it https://systemforgesoftware.com https://systemforge.es; do
  echo "=== $url ==="
  curl -sI "$url" | grep -iE 'HTTP/|last-modified|content-language'
done
```

Ver `commit-multilanguage.md` para semântica de mensagem/autor e
`multi-domain-rules.md` para isolamento dos 4 mercados.

## Histórico de revisão

- **2026-05-19** — Auditoria end-to-end. Documento estava descrevendo um estado
  passado: listava como abertos um [P0] já corrigido (run-lock), um workflow já
  deletado (`smoke-test.yml`) e um `cancel-in-progress: true` já trocado para
  `false`. Sincronizado com o repo; 14 itens de tech-debt resolvidos (ver §10).
- **2026-05-19 (continuação)** — Auditoria do elo de renderização MDX (estava
  fora do escopo das revisões anteriores, focadas em CI/CD). Achados [P0]: Velite
  rodava em modo não-estrito (post quebrado some sem quebrar o build) e 24 posts
  com MDX que não compila já estavam em `content/`; [P1]: `<FAQSchema>` órfão no
  runtime e ausência de guard de compilação no promote. Todos corrigidos. Novas
  seções §3.4 (guard MDX) e §7.2 (rehype-sanitize inerte).
- **2026-05-19 (continuação 2)** — Achado [P0] durante a validação do fix
  anterior: `relatedService` era `s.enum(...)` e o campo é escrito sem validação
  pelo pipeline de conteúdo — 210/379 posts pt-BR (55%) tinham valor não-canônico
  e eram **silenciosamente dropados** do build (404 em produção, build verde). O
  `strict: true` recém-adicionado teria convertido isso em CI vermelho
  permanente. Corrigido com camada de normalização
  (`src/lib/blog/normalize-service.ts`): schema cru `s.string()` + normalização
  no `.transform()`. Nova seção §7.3. Os 4 locales: velite strict build + `tsc`
  verdes.
