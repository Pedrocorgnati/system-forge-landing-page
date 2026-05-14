# Quality Gate Report — it-IT — 2026-04-25

## Sintesi

- **Articoli valutati:** 8 (3 PRIORITY + 5 PARITY)
- **APPROVED_FOR_DEPLOY:** 8
- **HELD_FOR_REWORK:** 0
- **REJECTED:** 0
- **Tasso di approvazione:** 100%

## Criteri di gate (invarianti applicati)

1. hreflang_pair con pt-BR (BLOQUEANTE per parity)
2. E-E-A-T (Pedro Corgnati come autore con bio inline)
3. Writing rules italiano (terminologia, registro, no robotix)
4. Anti-canibalizzazione vs MDX it-IT esistenti (178 articoli verificati)
5. Word count >= 1500
6. CTA >= 2 (mid + end)
7. FAQ >= 5 domande
8. Frontmatter v2 conforme template (locale, slug, date, author, relatedService)
9. No emoji, no travessao
10. Internal linking >= 3 to existing it-IT articles

## Verdetti per articolo

### PRIORITY (TOP 3 priority_score, NEW topics)

| # | Slug | Words | CTA | FAQ | hreflang | Anti-canib | Verdetto |
|---|------|-------|-----|-----|----------|------------|----------|
| 1 | `ia-riconoscimento-fattura-elettronica-gestionale-2026` | 1801 | 2 | 6 | n/a (no parity) | OK (nessun esistente) | APPROVED |
| 2 | `agente-ia-whatsapp-business-api-prezzo-2026` | 1707 | 13 | 6 | n/a | OK (cross-link a `chatbot-whatsapp-ia-azienda-costi-2026` e `whatsapp-business-api-chatbot-professionale`, angolo "agente LLM" vs "chatbot") | APPROVED |
| 3 | `pagopa-integrazione-software-aziendale-2026` | 1822 | 2 | 6 | n/a | OK (nicchia PA, nessun esistente) | APPROVED |

### PARITY (5 hub_slugs)

| # | Slug | Hub origine | Words | CTA | FAQ | hreflang_pair | Verdetto |
|---|------|-------------|-------|-----|-----|---------------|----------|
| 4 | `gestionale-vs-erp-personalizzato` | tiny-erp-vs-erp-personalizado | 1600 | 2 | 6 | OK (pt-BR + en + es-ES) | APPROVED |
| 5 | `assistenza-software-urgente` | suporte-de-software-urgente | 1739 | 4 | 6 | OK (pt-BR) | APPROVED |
| 6 | `software-house-vs-freelance` | software-house-vs-freelancer-qual-escolher | 1668 | 2 | 6 | OK (pt-BR + en + es-ES) | APPROVED |
| 7 | `piattaforma-web-urgente` | sistema-web-urgente | 1589 | 3 | 8 | OK (pt-BR) | APPROVED |
| 8 | `bug-produzione-urgente-sviluppatore-disponibile` | sistema-producao-bug-urgente-dev-disponivel | 1714 | 5 | 6 | OK (pt-BR) | APPROVED |

## Note di anti-canibalizzazione

- **`software-house-vs-freelance` vs `software-house-vs-freelance-quale-scegliere`**: il nuovo articolo posiziona se stesso come "guida MVP-specific 2026" e linka esplicitamente all'esistente come "pillar generico". Nessuna canibalizzazione: angolo, intent e keyword principali differenziati.
- **`gestionale-vs-erp-personalizzato` vs `danea-fatture-in-cloud-vs-erp-personalizzato`**: nuovo articolo e il pillar generico (TeamSystem, Zucchetti, Aruba, Danea), l'esistente e deep-dive Danea/Fatture in Cloud. Cross-link reciproco.
- **`agente-ia-whatsapp-business-api-prezzo-2026` vs `chatbot-whatsapp-ia-azienda-costi-2026` e `whatsapp-business-api-chatbot-professionale`**: keyword principale differenziata ("agente IA via API" vs "chatbot WhatsApp"). Cross-link a entrambi gli esistenti come pillar no-code/setup API.
- **`bug-produzione-urgente-sviluppatore-disponibile` vs `bug-produzione-venerdi-sera-dev-notte-2026` (brief solo, non MDX)**: l'altro brief e nicchia weekend/notte. Cross-link incluso anche se l'altro non e ancora MDX (sara generato in run successivo).

## Hreflang

- 5 articoli PARITY hanno `hreflang_pair` con almeno pt-BR popolato.
- 3 articoli PRIORITY hanno `hreflang_pair: []` (vuoto) perche nessun hub equivalente; saranno popolati da `/blog:hreflang-map` quando equivalenti pt-BR/en/es-ES esisteranno.

## E-E-A-T

Tutti gli 8 articoli includono bio inline di Pedro Corgnati con esperienza specifica al tema (numero progetti, geografia, anno). Nessun articolo con voce generica.

## Stile

- No emoji presenti.
- No travessao (—) — verificato grep.
- Italiano colloquiale + tecnico, non traduzione robotixa dal pt-BR. Esempi italiani specifici (Bergamo, Veneto, Emilia-Romagna, Roma, Milano, Bologna).
- Adattamento regulamentazione: GDPR, AI Act, Codice del Consumo, AgID/PagoPA, fattura elettronica SDI menzionati dove pertinente.

## Final verdict

**TUTTI GLI 8 ARTICOLI APPROVATI PER DEPLOY.** Nessun rework richiesto.
