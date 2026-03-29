# Forms & Inputs — Audit Tasks

Gerado por `/nextjs:forms` em 2026-03-29.
Workspace: `output/workspace/system-forge-landing-page`

---

## Resumo da Auditoria

| Componente | Issues | Críticos |
|---|---|---|
| `NewsletterOptIn.tsx` | 3 | 2 |
| `SearchBar.tsx` | 2 | 1 |
| `CookieConsentModal.tsx` | 1 | 0 |
| `ContactSection.tsx` | 0 | 0 |

---

## Tasks

### T001 – Email input sem `id` e sem `<label>` visível associada
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/NewsletterOptIn.tsx`

**Descrição:** O `<input type="email">` usa `aria-label` corretamente, mas não tem atributo `id`. Sem um `id`, não é possível associar uma `<label htmlFor>` visível. Adicionar `id="newsletter-email"` e uma `<label htmlFor="newsletter-email" className="sr-only">` garante acessibilidade completa e mantém o design atual.

**Critérios de Aceite:**
- [ ] `id="newsletter-email"` presente no input
- [ ] `<label htmlFor="newsletter-email" className="sr-only">` adicionada (visualmente oculta, acessível a leitores de tela)
- [ ] `aria-label` mantido como fallback

**Estimativa:** 0.25h
**Status:** COMPLETED

---

### T002 – Consent checkbox sem `aria-invalid`
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/NewsletterOptIn.tsx`

**Descrição:** O input de email expõe `aria-invalid={emailError ? 'true' : 'false'}` corretamente, mas o checkbox de consentimento não tem `aria-invalid`. Quando `consentError` está presente, leitores de tela não conseguem identificar que o campo está inválido.

**Critérios de Aceite:**
- [ ] `aria-invalid={consentError ? 'true' : 'false'}` adicionado ao checkbox
- [ ] Comportamento consistente com o input de email

**Estimativa:** 0.1h
**Status:** COMPLETED

---

### T003 – Submit button sem `aria-busy` durante submissão
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/NewsletterOptIn.tsx`

**Descrição:** O botão de submit fica `disabled` durante `submitting` mas não expõe `aria-busy="true"`. Leitores de tela podem não anunciar o estado de carregamento para o usuário.

**Critérios de Aceite:**
- [ ] `aria-busy={status === 'submitting'}` no componente `<Button>`

**Estimativa:** 0.1h
**Status:** COMPLETED

---

### T004 – SearchBar input fora de `<form role="search">`
**Tipo:** SEQUENTIAL
**Dependências:** none
**Arquivos:**
- modificar: `src/components/blog/SearchBar.tsx`

**Descrição:** O `<input type="search">` está dentro de um `<div>` sem wrapper `<form>`. Semanticamente, inputs de busca devem estar dentro de `<form role="search">` com `onSubmit={e => e.preventDefault()}`. Isso melhora a acessibilidade (leitores de tela anunciam "região de pesquisa") e permite que usuários de teclado ativem a busca com Enter de forma explícita. O comportamento de debounce não é afetado.

**Critérios de Aceite:**
- [ ] `<form role="search" onSubmit={e => e.preventDefault()}>` envolve o input
- [ ] Input recebe `id="blog-search-input"` (já tem data-testid, falta id)
- [ ] Comportamento de debounce preservado

**Estimativa:** 0.25h
**Status:** COMPLETED

---

### T005 – CookieConsentModal usando `aria-label` em vez de `aria-labelledby`
**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:**
- modificar: `src/components/ui/CookieConsentModal.tsx`

**Descrição:** O `role="dialog"` usa `aria-label={title}` diretamente. A prática recomendada para diálogos é `aria-labelledby` apontando para o `<h2>` que já contém o título — evita duplicação do texto e é mais robusto para i18n.

**Critérios de Aceite:**
- [ ] `<h2 id="cookie-modal-title">` no header do modal
- [ ] `aria-labelledby="cookie-modal-title"` substituindo `aria-label={title}` no div do dialog
- [ ] `aria-label` removido do wrapper principal

**Estimativa:** 0.15h
**Status:** COMPLETED

---

## Checklist Final

- [x] ContactSection — sem form, apenas links externos. Nenhuma ação necessária.
- [x] T001 — email input: id + label sr-only
- [x] T002 — consent checkbox: aria-invalid
- [x] T003 — submit button: aria-busy
- [x] T004 — SearchBar: form role="search" wrapper
- [x] T005 — CookieConsentModal: aria-labelledby

---

## Fora do escopo (identificado durante auditoria)

- Validação server-side do email na newsletter → `/server-actions`
- Sem react-hook-form/Zod — a validação manual atual é funcional para o escopo (2 campos). Migração seria refactor, não correção de bug.
