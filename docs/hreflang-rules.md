# Regras de Hreflang — Triple-Market (BR/IT/EN)

**Projeto:** SystemForge Landing Page
**Gerado em:** module-12-compliance-seo / TASK-3
**Referência INTAKE:** INT-029

---

## Visão Geral

Este projeto usa 3 domínios independentes com builds separadas por locale:

| Locale | Domínio | Build |
|--------|---------|-------|
| `pt-BR` | `forjadesistemas.com.br` | `npm run build:br` |
| `it-IT` | `systemforge.it` | `npm run build:it` |
| `en` | `systemforgesoftware.com` | `npm run build:en` |

As tags `<link rel="alternate" hreflang="...">` são injetadas no `<head>` de cada página pelo `layout.tsx`.

---

## 7 Regras Fundamentais

### 1. x-default aponta sempre para EN

```html
<link rel="alternate" hreflang="x-default" href="https://systemforgesoftware.com/" />
```

O domínio EN é o fallback global para usuários sem locale específico.

### 2. Artigos exclusivos — sem hreflang cross-domain

Artigos com `exclusive: true` no frontmatter **não** têm alternates para outros domínios. Cada domínio publica seu conteúdo exclusivo de forma independente.

```yaml
# frontmatter de artigo exclusivo pt-BR
locale: pt-BR
exclusive: true
# NÃO incluir hreflang_pair
```

### 3. Artigos universais — 3 alternates + x-default

Artigos com `hreflang_pair` no frontmatter são publicados nos 3 domínios com tradução adaptada.

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

### 4. Páginas de serviço — slugs nativos por locale

Cada locale usa o slug nativo da sua língua. **Nunca** usar o mesmo slug para todos os locales em pages de serviço.

| Rota | pt-BR | it-IT | en |
|------|-------|-------|----|
| Home | `/` | `/` | `/` |
| Serviços | `/servicos` | `/servizi` | `/services` |
| Portfolio | `/portfolio` | `/portfolio` | `/portfolio` |
| Sobre | `/sobre` | `/chi-siamo` | `/about` |
| Contato | `/contato` | `/contatto` | `/contact` |
| Blog | `/blog` | `/blog` | `/blog` |
| Conselheiro | `/conselheiro` | `/consulente` | `/advisor` |
| Privacidade | `/privacidade` | `/privacy` | `/privacy` |

### 5. Páginas de privacidade — sem cross-domain hreflang

Cada domínio tem sua própria página de privacidade com conteúdo jurídico específico (LGPD / GDPR / CAN-SPAM). **Não** incluir alternates cross-domain para páginas de privacidade.

```html
<!-- forjadesistemas.com.br/privacidade — sem alternates para IT/EN -->
<!-- systemforge.it/privacy — sem alternates para BR/EN -->
<!-- systemforgesoftware.com/privacy — sem alternates para BR/IT -->
```

### 6. Home page — cada domínio aponta para os outros 2 + x-default

```html
<!-- Em forjadesistemas.com.br/ -->
<link rel="alternate" hreflang="pt-BR" href="https://forjadesistemas.com.br/" />
<link rel="alternate" hreflang="it" href="https://systemforge.it/" />
<link rel="alternate" hreflang="en" href="https://systemforgesoftware.com/" />
<link rel="alternate" hreflang="x-default" href="https://systemforgesoftware.com/" />
```

### 7. Regra de Ouro — reciprocidade obrigatória

**Se A aponta para B, então B deve apontar para A.**

```
forjadesistemas.com.br/servicos → aponta para systemforge.it/servizi e systemforgesoftware.com/services
systemforge.it/servizi          → aponta para forjadesistemas.com.br/servicos e systemforgesoftware.com/services
systemforgesoftware.com/services → aponta para forjadesistemas.com.br/servicos e systemforge.it/servizi
```

---

## Como Adicionar uma Nova Rota

1. **Adicionar ao `ROUTE_SLUGS`** em `src/lib/locale-slugs.ts` com slugs nativos para os 3 locales
2. **Criar a página** em `src/app/{slug}/page.tsx` (a tag hreflang é gerada automaticamente pelo `layout.tsx`)
3. **Validar:** executar `npx tsx scripts/validate-hreflang-pages.ts` após o build
4. **Para páginas sem cross-domain hreflang** (ex: privacidade): não adicionar ao `ROUTE_SLUGS` ou tratar como caso especial no layout

---

## Implementação no Layout

As tags hreflang são injetadas pelo `layout.tsx`:

```tsx
{SUPPORTED_LOCALES.map(locale => (
  <link
    key={locale}
    rel="alternate"
    hrefLang={locale === 'pt-BR' ? 'pt-BR' : locale === 'it-IT' ? 'it' : 'en'}
    href={LOCALE_URLS[locale]}
  />
))}
<link rel="alternate" hrefLang="x-default" href={LOCALE_URLS['en']} />
```

---

## Validação Automatizada

```bash
# Após o build completo dos 3 locales:
npm run build:br && npm run build:it && npm run build:en
npx tsx scripts/validate-hreflang-pages.ts

# Relatório gerado em:
# scripts/hreflang-report.json
```

O script `validate-hreflang-pages.ts` valida:
- Presença de alternates para os 3 locales em cada página
- Uso de slugs nativos (não slug de outro locale)
- x-default apontando para systemforgesoftware.com
- Reciprocidade bidirecional
