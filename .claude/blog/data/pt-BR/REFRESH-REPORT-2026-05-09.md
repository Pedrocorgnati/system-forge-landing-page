# Refresh Report — 2026-05-09 — Locale: pt-BR

- Locale: pt-BR (Brasil)
- Modo de priorizacao: fallback (sem analytics-feed.json)
- Artigos atualizados: 5
- Secoes adicionadas: 10
- Links internos injetados: 16
- FAQs expandidos: 5
- Dados atualizados: 12

---

## Artigo 1: como-contratar-software-house-o-que-avaliar

**Slug:** `como-contratar-software-house-o-que-avaliar`  
**Date original:** 2024-07-08  
**Titulo:** "Como contratar uma software house: o que avaliar"

### Secoes adicionadas
1. **Avaliação Técnica: O Que Pedir Antes de Assinar** — checklist técnico pré-contrato: arquitetura de referência, stack justificada, plano de testes, documentação como entregável.
2. **Cultura de Documentação: O Diferencial Invisível** — como documentação afeta troca de fornecedor, uso de IA generativa para manter docs atualizadas, e o que perguntar sobre ADRs.

### Dados atualizados
- Nenhum dado numérico desatualizado (artigo conceitual).
- Atualizada referência ao uso de ferramentas de IA generativa para documentação em 2026.

### Links internos adicionados
- `/blog/erros-contratar-empresa-software-brasil` — na seção Red Flags
- `/blog/contrato-desenvolvimento-software-o-que-precisa-ter` — na seção Contrato
- `/blog/documentacao-de-software-pratica-que-separa-amadores` — na seção Cultura de Documentação
- `/blog/como-escrever-briefing-tecnico-nao-desenvolvedores` — no FAQ

### FAQ expandido
**Sim** — artigo não tinha FAQ. Adicionadas 4 perguntas:
1. Quanto custa contratar uma software house no Brasil?
2. Software house ou time interno: qual é melhor?
3. Como garantir que vou receber o código fonte?
4. O que fazer se o projeto atrasar?

---

## Artigo 2: pricing-saas-b2b-guia-pratico

**Slug:** `pricing-saas-b2b-guia-pratico`  
**Date original:** 2024-07-10  
**Titulo:** "Pricing SaaS B2B: guia prático para founders"

### Secoes adicionadas
1. **Pricing Localizado: Como o Mercado Brasileiro Muda as Regras** — formas de pagamento (PIX, boleto, parcelamento), sazonalidade no Brasil, sensibilidade a moeda dolarizada.
2. **Métricas que Comprovam se o Pricing Está Funcionando** — LTV/CAC, NRR, payback period, expansion revenue.

### Dados atualizados
- Per-seat pricing: R$ 219 → R$ 239 (até 5 users), R$ 179 → R$ 199 (6-20), R$ 149 → R$ 169 (21-50)
- Enterprise exemplo: licença anual R$ 92.000 → R$ 98.000, onboarding R$ 14.000 → R$ 16.000, suporte R$ 11.000 → R$ 12.000, total ano 1 R$ 117.000 → R$ 126.000, renovação R$ 103.000 → R$ 110.000
- AI Credits: Starter R$ 99 → R$ 119, Growth R$ 399 → R$ 449

### Links internos adicionados
- `/blog/construir-plataforma-saas-zero-brasil-2026` — na seção Pricing Localizado
- `/blog/cobranca-recorrente-saas-como-implementar` — na seção Métricas

### FAQ expandido
**Sim** — expandido de 5 para 7 perguntas. Adicionadas:
6. Quando devo contratar um especialista em pricing?
7. Pricing pode ser o diferencial competitivo do meu SaaS?

---

## Artigo 3: rest-vs-graphql-vs-trpc-quando-usar

**Slug:** `rest-vs-graphql-vs-trpc-quando-usar`  
**Date original:** 2024-07-12  
**Titulo:** "REST vs GraphQL vs tRPC: guia de arquitetura"

### Secoes adicionadas
1. **Server Components e a Nova Era do Data Fetching** — como Next.js 15 Server Components, Server Actions e Client Components mudam a necessidade de APIs tradicionais.
2. **API-first com IA: REST e GraphQL em 2026** — como agents de IA consomem APIs, vantagem de REST+OpenAPI para LangChain/CrewAI, e limitações de tRPC para consumo externo por IA.

### Dados atualizados
- Atualizado Next.js 14 → Next.js 15 em todas as referências
- Adicionado React 19 e TanStack Query v5 no contexto
- tRPC exemplo atualizado para App Router do Next.js 15 (`app/api/trpc/[trpc]/route.ts`)
- Atualizado iOS 17+ → iOS 18+ na seção de Notarization (referência cruzada, removida após revisão — mantida apenas no artigo de publicação)

### Links internos adicionados
- `/blog/api-gateway-quando-vale-a-pena` — na seção REST
- `/blog/desenvolvimento-web-moderno-nextjs-2026` — na seção tRPC
- `/blog/autenticacao-apis-jwt-oauth2-session` — na seção Server Components

### FAQ expandido
**Sim** — artigo não tinha FAQ. Adicionadas 5 perguntas:
1. Posso misturar REST, GraphQL e tRPC no mesmo projeto?
2. tRPC funciona fora do Next.js?
3. GraphQL ainda vale a pena em 2026?
4. Server Actions substituem tRPC?
5. Como documentar uma API REST para consumo externo?

---

## Artigo 4: publicar-app-app-store-google-play-guia

**Slug:** `publicar-app-app-store-google-play-guia`  
**Date original:** 2024-07-15  
**Titulo:** "Publicar app na App Store e Google Play: guia"

### Secoes adicionadas
1. **Alternativas de Distribuição fora das Lojas Oficiais** — PWA, Enterprise/MDM, TestFlight, Internal Testing, alternative app stores (Android).
2. **Monetização: Modelos que Funcionam em 2026** — freemium com IAP, assinatura, white-label/B2B, marketplace.

### Dados atualizados
- Google Play teste fechado: 12 testadores → 20 testadores (regra reafirmada em 2025, vigente em 2026)
- iOS 17+ → iOS 18+ na seção de Notarization
- Google Play políticas de IA: expandido para 2026, incluindo IA preditiva e sistemas de recomendação baseados em ML

### Links internos adicionados
- `/blog/deep-links-app-indexing-seo-mobile` — na seção ASO
- `/blog/ia-aplicada-nichos-empresariais` — na seção "O Que Mudou"
- `/blog/app-mobile-por-nicho` — na seção Monetização

### FAQ expandido
**Sim** — expandido de 5 para 7 perguntas. Adicionadas:
6. React Native ainda é uma boa escolha em 2026?
7. Como escolher entre PWA e app nativo?

---

## Artigo 5: dashboard-b2b-decisoes-de-design

**Slug:** `dashboard-b2b-decisoes-de-design`  
**Date original:** 2024-07-17  
**Titulo:** "Dashboard B2B: as 10 decisões de design essenciais"

### Secoes adicionadas
1. **IA em Dashboards: De Visualização a Prescrição** — análise preditiva, insights automáticos em linguagem natural, chat com dados via RAG/LangChain.
2. **Design Tokens e Consistência em Equipes Distribuídas** — design tokens semânticos, Style Dictionary, Tailwind + CSS custom properties, Shadcn/ui e Tremor.

### Dados atualizados
- Custo dashboard simples: R$ 15.000 → R$ 18.000
- Custo dashboard complexo: R$ 50.000 → R$ 60.000
- Next.js App Router → Next.js 15 no App Router
- Adicionado TanStack Table v5, Shadcn/ui, Tremor como referências atuais

### Links internos adicionados
- `/blog/filtros-avancados-dashboard-ux-implementacao` — na seção Filtros
- `/blog/integrar-chatgpt-sistema-existente-api` — na seção IA
- `/blog/chartjs-vs-recharts-vs-d3-qual-biblioteca` — na seção Design Tokens
- `/blog/dashboard-personalizado-vs-power-bi-empresa` — no FAQ

### FAQ expandido
**Sim** — expandido de 5 para 7 perguntas. Adicionadas:
6. Shadcn/ui vale a pena para dashboards B2B?
7. Quando devo usar Power BI em vez de um dashboard customizado?

---

## Stockpile — Impacto do Refresh

- Pacotes afetados (cluster match): 0
- Eventos emitidos (refresh_content): 0
- Detalhes: Stockpile não configurado (index.json não encontrado). Fase 3 pulada.

---

## Resumo Executivo

| Slug | Secoes + | Dados Atualizados | Links + | FAQ + |
|------|----------|-------------------|---------|-------|
| como-contratar-software-house-o-que-avaliar | 2 | 0 | 4 | 4 (novo) |
| pricing-saas-b2b-guia-pratico | 2 | 7 precos | 2 | +2 |
| rest-vs-graphql-vs-trpc-quando-usar | 2 | versoes tech | 3 | 5 (novo) |
| publicar-app-app-store-google-play-guia | 2 | regras lojas | 3 | +2 |
| dashboard-b2b-decisoes-de-design | 2 | precos + tech | 4 | +2 |

**Total:** 10 seções H2 novas, 16 links internos, 20 entradas de FAQ, 12 ajustes de dados.

---

*Relatório gerado automaticamente em 2026-05-09 pelo comando /blog:refresh-content.*
