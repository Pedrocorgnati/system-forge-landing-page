# Quality Gate Report — pt-BR — 2026-04-25

**Locale:** pt-BR (hub)
**Pipeline:** /auto-flow blog daily, steps 5-8
**Run date:** 2026-04-25
**Selecionados:** TOP 3 clusters por priority_score (95.0, 94.0, 93.0) do `deduplicated-daily-2026-04-25.json`
**Excluidos:** clusters de parity_link (spokes pt-BR -> outros locales) — pt-BR é hub, não spoke

---

## Resumo

| Status | Count |
|--------|-------|
| APPROVED_FOR_DEPLOY | 3 |
| HELD_FOR_REWORK | 0 |
| REJECTED | 0 |

---

## Invariantes avaliadas (todos os artigos)

1. **hreflang_pair em hubs pt-BR:** ACEITAVEL ausente — array vazio `hreflang_pair: []`. Spec hub-spoke prevê preenchimento posterior quando spokes nascerem em it-IT/en/es-ES. Registrado para `/blog:hreflang-map` futuro.
2. **E-E-A-T (autor + experiência prática + dado original):** PASS em todos. Pedro Corgnati identificado, parágrafo de credenciais com cases reais, dados originais (tabelas de custo, cronogramas) baseados em projetos próprios.
3. **Writing rules pt-BR:** PASS. Sem emojis, sem travessão (em-dash), tom informal-profissional ("você"), sem clichés proibidos ("neste artigo vamos explorar", "é importante ressaltar").
4. **Anti-canibalização (slug + title vs MDX existentes):** PASS. Slugs únicos. Títulos diferenciados dos hubs colidentes (Tiny vs custom, suporte urgente, bug em produção) — todos com hub link como pré-requisito de leitura conforme rewrite_instructions.
5. **Word count >= 1500:** PASS em todos (1908-2105 palavras).
6. **CTA em 2+ pontos:** PASS — todos com 2 blockquotes CTA (mid e end) apontando para `forjadesistemas.com.br/contato`.
7. **FAQ presente (min 5 Q):** PASS — 5 perguntas em cada artigo com schema-friendly format `**N. Pergunta?**`.

---

## Artigo 1 — tiny-erp-nao-atende-migracao-custom-2026

**Veredito:** APPROVED_FOR_DEPLOY

| Métrica | Valor | Limite | Status |
|---------|-------|--------|--------|
| Word count | 2095 | >=1500 | PASS |
| Title chars | 67 | <=70 ideal | PASS (acima do ideal SEO 60 mas dentro do tolerável) |
| Description chars | 141 | 140-160 | PASS |
| Internal links (/blog/) | 4 | >=3 | PASS |
| External links (https) | 2 | >=2 (CTAs) | PASS |
| FAQ count | 5 | >=5 | PASS |
| CTA blockquotes | 2 | >=2 | PASS |
| Em-dashes | 0 | =0 | PASS |
| Emojis | 0 | =0 | PASS |
| H1 = title | sim | obrigatório | PASS |
| hreflang_pair | [] | vazio aceitável (hub) | PASS |
| Slug colisão | 0 | =0 | PASS |
| relatedService | sistemas-personalizados | enum válida | PASS |

**Internal links:** tiny-erp-vs-erp-personalizado (hub obrigatório), erp-pequenas-empresas-construir-vs-comprar, migracao-sistema-legado, manutencao-de-sistema-urgente.

**E-E-A-T:** Pedro Corgnati identificado. Cases reais citados (e-commerce moda, distribuidora autopeças, indústria embalagens). Tabela de custos por fase em R$ é dado original.

---

## Artigo 2 — bug-producao-sexta-noite-dev-madrugada-2026

**Veredito:** APPROVED_FOR_DEPLOY

| Métrica | Valor | Limite | Status |
|---------|-------|--------|--------|
| Word count | 1908 | >=1500 | PASS |
| Title chars | 70 | <=70 | PASS |
| Description chars | 152 | 140-160 | PASS |
| Internal links (/blog/) | 3 | >=3 | PASS |
| External links (https) | 2 | >=2 (CTAs) | PASS |
| FAQ count | 5 | >=5 | PASS |
| CTA blockquotes | 2 | >=2 | PASS |
| Em-dashes | 0 | =0 | PASS |
| Emojis | 0 | =0 | PASS |
| H1 = title | sim | obrigatório | PASS |
| hreflang_pair | [] | vazio aceitável (hub) | PASS |
| Slug colisão | 0 | =0 | PASS |
| relatedService | manutencao-sistemas | enum válida | PASS |

**Internal links:** sistema-producao-bug-urgente-dev-disponivel (hub obrigatório), suporte-de-software-urgente, manutencao-de-sistema-urgente.

**E-E-A-T:** Pedro Corgnati com plantão real via WhatsApp. Casos reais cotados em R$ (e-commerce sexta 23h R$ 3.200, clínica sábado R$ 800, marketplace madrugada R$ 4.800). Tabela tipo × SLA × custo é dado original.

---

## Artigo 3 — suporte-software-24x7-sistema-legacy-php-2026

**Veredito:** APPROVED_FOR_DEPLOY

| Métrica | Valor | Limite | Status |
|---------|-------|--------|--------|
| Word count | 2105 | >=1500 | PASS |
| Title chars | 67 | <=70 | PASS |
| Description chars | 152 | 140-160 | PASS |
| Internal links (/blog/) | 3 | >=3 | PASS |
| External links (https) | 2 | >=2 (CTAs) | PASS |
| FAQ count | 5 | >=5 | PASS |
| CTA blockquotes | 2 | >=2 | PASS |
| Em-dashes | 0 | =0 | PASS |
| Emojis | 0 | =0 | PASS |
| H1 = title | sim | obrigatório | PASS |
| hreflang_pair | [] | vazio aceitável (hub) | PASS |
| Slug colisão | 0 | =0 | PASS |
| relatedService | manutencao-sistemas | enum válida | PASS |

**Internal links:** suporte-de-software-urgente (hub obrigatório), lgpd-sistema-empresa-adequar-2026, integrar-sistemas-legados-sem-reescrever.

**E-E-A-T:** Pedro Corgnati com cases reais (Magento 1 invadido, Joomla 3 sem patch, portal NFe em PHP 5.6). CVEs específicas citadas (CVE-2019-11043, CVE-2022-31625, CVE-2023-3823, CVE-2024-2756). Datas de fim de vida do PHP corretas (5.x em 2018, 7.x em 2022). Tabela de custo de plantão é dado original.

---

## Ajustes feitos durante review-seo (Step 7)

- Article 1 (tiny-erp): título reduzido de 75 para 67 chars; +3 internal links adicionados (era apenas 1).
- Article 2 (bug-producao): +2 internal links adicionados (era apenas 1).
- Article 3 (suporte-php): título reduzido de 83 para 67 chars; +1 CTA blockquote adicionada (era 1, agora 2); +2 internal links adicionados.
- Todos: substituição global de em-dashes por vírgulas/dois-pontos/hífens para conformar com writing rule "sem travessão".
- Todos: H1 sincronizado com `title` do frontmatter (regra SEO H1=title).

---

## Próximos steps (fora do escopo deste run)

- `/blog:build-metadata` — gerar JSON-LD (BlogPosting, FAQPage, HowTo) para os 3 artigos
- `/blog:build-internal-links` — atualizar links inbound dos hubs (tiny-erp-vs-erp-personalizado, suporte-de-software-urgente, sistema-producao-bug-urgente-dev-disponivel) apontando para os novos spokes
- `/blog:hreflang-map` — quando spokes correspondentes nascerem em it-IT/en/es-ES, atualizar `hreflang_pair`
- `/blog:deploy` — após build pass

---

**Gate report assinado:** Step 8 quality-gate concluído. 3/3 APPROVED_FOR_DEPLOY.
