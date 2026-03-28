# Google Search Console — Triple Market Setup

> Documento de referência para configuração do Google Search Console e GA4
> para os 3 domínios do sistema i18n-triple-market.
>
> INT-012, INT-073 — module-9-seo-sitemaps TASK-4

---

## Pré-requisitos

- Acesso ao Google Search Console em `search.google.com/search-console`
- Acesso ao Google Analytics em `analytics.google.com`
- DNS ativo e HTTPS configurado nos 3 domínios
- Sitemaps gerados e acessíveis em cada domínio (após deploy)

---

## 1. Adicionar Propriedades no Search Console (3 domínios)

Para **cada** domínio, repetir o processo:

### Domínios
| Mercado | URL | Locale |
|---------|-----|--------|
| Brasil  | `https://forjadesistemas.com.br` | `pt-BR` |
| Italia  | `https://systemforge.it` | `it-IT` |
| Global (EN) | `https://systemforgesoftware.com` | `en` |

### Passos
1. Acesse **Search Console → Adicionar propriedade**
2. Selecione **"Prefixo de URL"** (não "Domínio" — necessário para International Targeting)
3. Insira a URL completa do domínio (ex: `https://forjadesistemas.com.br`)
4. Escolha método de verificação: **"Tag HTML"**
5. Copie o conteúdo do atributo `content` da meta tag exibida
6. Adicione ao `.env.local` do build correspondente:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=seu_token_aqui
   ```
7. Faça o deploy e clique em **"Verificar"**

> **Nota:** O token é por propriedade. Cada build (BR, IT, EN) usa seu próprio `.env.local` com o token do respectivo domínio.

---

## 2. Configurar Geotargeting para .com → Estados Unidos

O domínio `systemforgesoftware.com` é o mercado EN global com targeting para EUA.

1. Abra a propriedade `systemforgesoftware.com` no Search Console
2. **Configurações → International Targeting → Country**
3. Selecione **"United States (US)"**
4. Salve

> **Nota:** "International Targeting" só aparece em propriedades configuradas como **Prefixo de URL** (não "Domínio"). Se não aparecer, verifique o tipo de propriedade.

---

## 3. Submeter Sitemaps

Para **cada** propriedade, após o deploy:

1. Search Console → **Sitemaps** (menu lateral)
2. Campo "Adicionar um novo sitemap": digitar `sitemap.xml`
3. Clicar **"Enviar"**
4. Aguardar indexação: normalmente 24–48h, pode levar até 7 dias

### Checklist de Sitemaps
- [ ] `forjadesistemas.com.br/sitemap.xml` enviado
- [ ] `systemforge.it/sitemap.xml` enviado
- [ ] `systemforgesoftware.com/sitemap.xml` enviado

---

## 4. Configurar Google Analytics 4 (3 Data Streams)

### Criar Propriedades e Streams

Para **cada** domínio:

1. Acesse `analytics.google.com`
2. **Admin → Criar propriedade**
3. Nome: `Forja de Sistemas` / `SystemForge IT` / `SystemForge EN`
4. **Adicionar stream de dados → Web**
5. URL: domínio correspondente
6. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)
7. Adicione ao `.env.local` do build:
   ```
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

> **Cada build tem seu próprio Measurement ID.** Não compartilhe IDs entre domínios.

### Verificar Eventos

Após o deploy:
1. GA4 → **Relatórios → Em Tempo Real**
2. Abra o site no browser
3. Verifique se eventos chegam (pode levar 1–2 minutos)

---

## 5. Checklist Pré-Deploy — SEO Técnico

### Código (fazer antes do deploy)
- [ ] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` no `.env.local` de cada build
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` no `.env.local` de cada build
- [ ] `npm run type-check` retorna 0 erros
- [ ] `npm run validate:hreflang` retorna 0 erros (blog frontmatter)
- [ ] `npm run build:br && npm run build:it && npm run build:en` completos sem erros

### Após deploy (domínios ativos)
- [ ] Propriedade BR verificada no Search Console
- [ ] Propriedade IT verificada no Search Console
- [ ] Propriedade EN verificada no Search Console
- [ ] Geotargeting .com → United States configurado
- [ ] Sitemaps submetidos nas 3 propriedades
- [ ] Status sitemaps: "Sucesso" (aguardar 24–48h)
- [ ] `npm run validate:sitemap-hreflang` retorna 0 violações (requer builds)
- [ ] GA4 streams criados e eventos chegando (Real-time)

---

## Troubleshooting

### "International Targeting" não aparece no Search Console
- Verificar que a propriedade é do tipo **"Prefixo de URL"** (não "Domínio")
- Recriar a propriedade se necessário

### Sitemap com status "Não pode ser lido"
- Verificar que `npm run build:br` (ou it/en) gerou corretamente
- Testar URL no browser: `https://dominio.com/sitemap.xml`
- Verificar que `next.config.ts` não tem redirects bloqueando `/sitemap.xml`

### Erro hreflang "Valor alternado" no Search Console
1. Executar `npm run validate:sitemap-hreflang` para detectar violações
2. Verificar reciprocidade em `src/app/sitemap.ts`
3. Aguardar recrawl (pode levar 1–2 semanas após a correção)

### Meta tag de verificação não aparece no HTML
- Verificar `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` no `.env.local` correto
- Em dev: executar `npm run build && npm run start` (não `next dev`)
- Inspecionar `<head>` da página home

### Geotargeting do .com confirmado como Brasil pelo Google
- Aguardar 24–48h após configurar o International Targeting
- O Google pode levar alguns dias para atualizar o geotargeting

---

## Variáveis de Ambiente por Build

| Variável | BR | IT | EN |
|----------|----|----|-----|
| `NEXT_PUBLIC_LOCALE` | `pt-BR` | `it-IT` | `en` |
| `NEXT_PUBLIC_SITE_URL` | `https://forjadesistemas.com.br` | `https://systemforge.it` | `https://systemforgesoftware.com` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Token BR | Token IT | Token EN |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `G-XXXXBR` | `G-XXXXIT` | `G-XXXEN` |

> Os tokens são confidenciais — não commitar em repositórios públicos.
> Configurar no CI/CD como secrets (ver `docs/ci-cd-secrets.md`).
