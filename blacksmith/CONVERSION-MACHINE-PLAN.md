# Plano de Ação — Transformar a Landing em Máquina de Conversão (sem impactar blog)

## 1) Entendimento da arquitetura atual (resumo técnico)

- O projeto é **multiidioma por build** (não por rota dinâmica): `NEXT_PUBLIC_LOCALE` define um build isolado para `pt-BR`, `it-IT`, `en`, `es-ES`.
- A configuração de mercado está centralizada em `config/`:
  - `config/sites/*.ts` (branding, domínio, rotas, SEO)
  - `config/content.ts` (mensagens e conteúdos por locale)
  - `config/index.ts` + `src/lib/i18n.ts` (resolução de locale/config)
- A landing principal está em `src/app/page.tsx` e em seções server/client (`src/components/sections/*`).
- O blog usa pipeline próprio via **Velite/MDX**:
  - conteúdo em `content/{locale}/blog/**/*.mdx`
  - configuração em `velite.config.ts`
  - páginas em `src/app/blog/**`
- SEO internacional já existe com `sitemap.ts`, `robots.ts`, hreflang e validações em `scripts/`.

## 2) Objetivo de negócio

Aumentar taxa de conversão da landing para contratação de software (lead qualificado + contato) mantendo íntegro o fluxo editorial do blog (criação/publicação/indexação).

**ICP prioritário (locked):** PME e scale-up B2B (10–200 funcionários) buscando software sob medida, ERP nichado ou automação com IA. Ticket-alvo R$30k–R$300k por projeto, decisor único ou dupla (sócio + tech lead).

**KPI norte (locked):** Reuniões agendadas qualificadas — lead que preencheu form, foi qualificado e agendou call de descoberta. Métricas de volume (form submits, cliques) entram como leading indicators, não como sucesso final.

**Locale primary (locked):** pt-BR recebe copy artesanal, prova social local e A/B. it-IT, en, es-ES entram em paridade técnica (tradução fiel + JSON-LD/SEO) mas sem A/B nem cases locais no Sprint 1–2.

**Captura primária (locked):** Formulário progressivo 2-passos in-page (LeadQualifierForm). WhatsApp e agendamento direto entram como CTAs secundários por contexto, nunca como primário do hero.

## 3) Guardrails (não quebrar blog)

### Escopo permitido
- `src/app/page.tsx`
- `src/components/sections/*` (apenas seções da landing)
- `content/*/pages/messages.json` e `content/*/messages.json` para copy de landing
- `src/lib/data.ts` (somente dados de cards/serviços da landing)
- `src/lib/seo/*` (apenas metadados institucionais/landing)

### Escopo proibido nesta iniciativa
- `content/*/blog/**`
- `src/app/blog/**`
- `src/components/blog/**`
- `velite.config.ts`
- scripts de publicação/indexação do blog

### Gate obrigatório por PR
- `npm run validate:frontmatter`
- `npm run validate:sitemap-hreflang`
- `npm run validate:hreflang-pages`
- `npm run validate:jsonld`
- smoke visual da home + blog index + blog post em cada locale

## 4) Estratégia de conversão (landing)

## Fase A — Oferta e proposta de valor (hero)

1. Reescrever hero com promessa específica para PME/scale-up B2B em pt-BR (software sob medida, automação com IA, ERP nichado). Demais locales recebem tradução fiel da mesma promessa no Sprint 1.
2. Inserir prova de confiança acima da dobra com **métricas agregadas verificáveis (sem logos no Sprint 1)**:
   - projetos entregues (número absoluto honesto)
   - prazo médio de entrega (semanas)
   - taxa de renovação / retenção de cliente
   - opcionalmente: anos de operação, NPS médio
   - **explicitamente fora do Sprint 1:** logos de clientes (exige autorização formal, posterga hero); depoimentos textuais (entram no Sprint 2 se coletados)
3. CTA primário único e forte: **"Solicitar escopo em 24h"** (locked Sprint 1, anchor para A/B no Sprint 3). Promessa exige SLA real cumprido pelo operador — auto-reply do form confirma "escopo em até 24h". CTAs secundários por contexto: WhatsApp ao final do bloco "Como funciona", Cal.com após "Casos de uso".
4. Microcopy de risco reverso (ex: diagnóstico inicial, clareza de escopo, sem compromisso).

## Fase B — Qualificação de lead sem fricção

1. Formulário progressivo em 2 passos (dados básicos > contexto do projeto).
2. Campos exatos (locked Sprint 1):

**Passo 1 (atrito mínimo):**
- nome completo (text, required)
- email corporativo (email, required, validação Zod)
- empresa (text, required, livre)

**Passo 2 (qualificação):**
- tipo de software (select, required): sob medida / ERP nichado / automação com IA / outro
- urgência (radio, required): 1 mês / 3 meses / 6+ meses / explorando
- faixa de investimento (radio, required): <R$50k / R$50–150k / R$150–300k / R$300k+
- canal preferido (radio, required): WhatsApp / email / call agendada
- consentimento LGPD (checkbox, required) inline com link para política de privacidade

Sem telefone (canal define como contatar). Sem textarea de contexto livre (drop-off alto em mobile).
3. Mensagens por locale para reduzir ambiguidade.
4. Confirmação com próximo passo claro (SLA de retorno de 24h e canal preferido).

**Stack de persistência e notificação (locked Sprint 1):** route handler Next.js → Resend (email transacional) com 2 disparos: (a) email para o operador com todos os campos do form em HTML estruturado, (b) auto-reply ao lead confirmando SLA de 24h. Opcionalmente webhook para Slack via incoming webhook URL. Sem banco de dados próprio nesta fase — histórico vive no inbox + Slack. Re-avaliar para Supabase quando volume passar ~50 leads/mês.

## Fase C — Prova e redução de objeção

1. Bloco "Como funciona" orientado a decisão (descoberta -> escopo -> execução -> suporte).
2. Casos de uso por vertical — **trio locked Sprint 2:**
   - **E-commerce / varejo** (gestão de pedidos, estoque integrado, marketplace)
   - **Saúde / clínica** (prontuário eletrônico, agenda, faturamento TISS)
   - **Logística / distribuição** (roteirização, rastreamento, integração WMS)

   Cada vertical com 1 case real ou mockado realista + resultado esperado em métrica concreta. Bloco final "também atendemos fintech, educação e outros segmentos" linkando a contato.
3. FAQ comercial focada em objeções de compra:
   - prazo
   - custo
   - propriedade intelectual
   - suporte pós-entrega
4. CTA contextual após cada bloco-chave (não só no final).

## Fase D — SEO transacional da landing

1. Otimizar title/description da home por locale com intenção comercial.
2. Enriquecer JSON-LD da landing (`Organization`, `Service`, `FAQPage`, `BreadcrumbList`, `WebPage`).
3. Ajustar heading hierarchy (H1 único + H2 por seção de intenção).
4. Melhorar links internos institucionais (serviços/contato) sem alterar malha editorial do blog.

## Fase E — Performance que impacta conversão

1. Garantir LCP < 2.5s na home (imagens hero otimizadas e prioridade correta).
2. Remover scripts não essenciais above-the-fold.
3. Confirmar CLS baixo em componentes dinâmicos (carrosséis/embeds).
4. Rodar Lighthouse por locale com baseline e meta.

## 5) Instrumentação de funil (sem tocar no blog)

## Eventos mínimos (GA4)
- `landing_view`
- `cta_primary_click`
- `cta_secondary_click`
- `form_start`
- `form_step_advance`
- `form_submit`
- `lead_qualified` (qualificação manual ou auto pós-submit)
- `meeting_scheduled` (**evento de conversão principal** — alinhado ao KPI norte)
- `whatsapp_click` (CTA secundário)
- `schedule_click` (CTA secundário)

## Segmentações
- locale
- origem (utm_source/utm_medium/utm_campaign)
- tipo de serviço selecionado

## KPI alvo

**Primary KPI (norte):**
- reuniões agendadas qualificadas (mensal, por locale)

**Leading indicators:**
- CTR do hero CTA
- taxa de início do formulário (form_start / landing_view)
- taxa de conclusão Passo 1 → Passo 2
- taxa de envio do formulário (form_submit / form_start)
- taxa de qualificação (lead_qualified / form_submit)
- taxa de agendamento pós-qualificação (meeting_scheduled / lead_qualified)

## 6) Plano de implementação por sprint

## Sprint 1 — Fundação de conversão (foco pt-BR) — **prazo: 2 semanas (10 dias úteis)**

Distribuição planejada:
- **Dias 1–3:** rework de hero + copy artesanal pt-BR (ICP PME B2B) + design + prova social com métricas agregadas verificáveis
- **Dias 4–6:** LeadQualifierForm 2-passos com schema Zod + integração Resend (email operador + auto-reply 24h) + webhook Slack opcional
- **Dias 7–8:** setup PostHog (`posthog-js`) + eventos topo de funil (`landing_view`, `cta_primary_click`, `form_start`, `form_step_advance`, `form_submit`, `lead_qualified`, `meeting_scheduled`)
- **Dias 9–10:** tradução fiel da copy pt-BR para it-IT/en/es-ES + smoke tests + validações SEO/hreflang + deploy staging

## Sprint 2 — Qualificação e autoridade
- FAQ comercial
- blocos de casos por serviço
- JSON-LD refinado e melhoria on-page SEO

## Sprint 3 — Otimização contínua
- A/B de headline e CTA
- melhoria de UX mobile
- ajuste por dados de funil

## 7) Backlog técnico recomendado

1. Componente `ConversionHero` isolado por locale.
2. Componente `LeadQualifierForm` com schema validado.
3. Camada de tracking centralizada via **PostHog** (`posthog-js`) — unifica analytics, feature flags e session replay. GA4 mantido em paralelo apenas para sinal de SEO/Search Console; eventos de funil são autoritativos em PostHog. Credencial via `credentials.analytics.posthog.personal_api_key` (ORCH) já mapeada em SystemForge.
4. Flags A/B via **PostHog feature flags** (mesmo SDK, mesmo dashboard, sem deploy por variante). Escopo restrito a componentes da landing — flags nunca afetam código do blog.
5. Testes e2e focados em jornada de conversão (home -> CTA -> envio).

## 8) Critérios de aceite (Definition of Done)

1. Blog continua publicando/gerando normalmente (sem alteração de fluxo/content).
2. Todas as validações SEO/hreflang passam por locale.
3. Conversão da home mensurável com eventos de funil.
4. Performance da home mantida/melhorada.
5. Sem regressão em rotas de blog (`/blog`, `/blog/[slug]`, paginação, categoria, tag).

## 9) Sequência operacional segura

1. Trabalhar direto em `main` (regra inviolável Trunk-Based / Always Main do CLAUDE.md raiz — pipelines paralelas no mesmo workspace dependem disso). Rollback via `git revert <sha>`, nunca branch nova.
2. Aplicar Fase A e B primeiro (pt-BR como locale primary).
3. Rodar validações + smoke home/blog em todos os locales.
4. Publicar em staging por locale.
5. Revisar métricas por 7 dias.
6. Executar Fases C/D/E com base em dados reais.

---

## Decisoes resolvidas via /tools:auq-interview

| Pergunta | Opcao escolhida | Delta aplicado | Timestamp |
|----------|-----------------|----------------|-----------|
| ICP prioritário | PME / scale-up B2B (10–200 funcionários, ticket R$30k–R$300k) | Adicionado bloco "ICP prioritário (locked)" na seção 2; Fase A.1 especifica PME B2B em pt-BR | 2026-05-19 R1 |
| KPI norte | Reuniões agendadas qualificadas | Bloco "KPI norte (locked)" na seção 2; KPI alvo reescrito com primary + leading indicators; eventos GA4 incluem `lead_qualified` + `meeting_scheduled` como conversion | 2026-05-19 R1 |
| Locale priority | pt-BR primary, demais paridade mínima | Bloco "Locale primary (locked)" na seção 2; Sprint 1 com foco pt-BR + tradução fiel para os outros 3 locales | 2026-05-19 R1 |
| Captura primária | Formulário progressivo 2-passos in-page | Bloco "Captura primária (locked)" na seção 2; Sprint 1 lista LeadQualifierForm 2-passos explicitamente; WhatsApp e Cal.com viram CTAs secundários | 2026-05-19 R1 |
| Sequência operacional (correção de guardrail) | Trabalhar direto em `main` (Trunk-Based) | Sequência operacional item 1 substituído: "Criar branch específica" → "Trabalhar direto em main" com referência à regra inviolável do CLAUDE.md | 2026-05-19 R1 |
| Prova social Sprint 1 | Métricas agregadas verificáveis (sem logos) | Fase A item 2 reescrito: lista métricas honestas (projetos, prazo médio, renovação, anos, NPS) e exclui explicitamente logos e depoimentos do Sprint 1 | 2026-05-19 R2 |
| Backend de lead | Resend (email transacional) + webhook Slack opcional | Fase B novo bloco "Stack de persistência e notificação (locked Sprint 1)" após item 4: route handler Next.js → Resend com email operador + auto-reply; Supabase fica para >50 leads/mês | 2026-05-19 R2 |
| Verticais de casos | 3 verticais quentes do ICP PME B2B | Fase C item 2 reescrito: 3 verticais a escolher entre e-commerce, saúde, logística, fintech, educação; bloco final "também atendemos outros segmentos" linkando contato | 2026-05-19 R2 |
| Stack tracking + A/B | PostHog (tracking + flags + session replay) | Backlog itens 3 e 4 reescritos: PostHog como autoritativo de eventos de funil, GA4 só para SEO; feature flags da PostHog para A/B; credencial já mapeada via `credentials.analytics.posthog.personal_api_key` | 2026-05-19 R2 |
| Form fields exatos | P1 (nome+email+empresa) / P2 (tipo+urgência+budget+canal+LGPD) | Fase B item 2 reescrito com lista completa de campos, tipos (text/email/select/radio/checkbox), required flags e validação Zod; sem telefone, sem textarea | 2026-05-19 R3 |
| CTA primário copy | "Solicitar escopo em 24h" | Fase A item 3 lockado com a copy exata; SLA real exigido; CTAs secundários (WhatsApp, Cal.com) posicionados contextualmente | 2026-05-19 R3 |
| Trio de verticais Sprint 2 | E-commerce/varejo + Saúde/clínica + Logística/distribuição | Fase C item 2 lockado com 3 verticais nomeadas + exemplos de domínio por vertical (prontuário, roteirização etc); demais segmentos via bloco linkando contato | 2026-05-19 R3 |
| Deadline Sprint 1 | 2 semanas (10 dias úteis) com distribuição diária | Sprint 1 reescrito com cronograma dia-a-dia (dias 1–3 hero, 4–6 form/Resend, 7–8 PostHog, 9–10 tradução+staging) | 2026-05-19 R3 |

