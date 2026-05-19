# Build Guide — System Forge Landing Page (Multi-Locale)

Este projeto suporta **4 locales**: 🇧🇷 `pt-BR`, 🇮🇹 `it-IT`, 🇺🇸 `en`, 🇪🇸 `es-ES`

## ⚠️ IMPORTANTE: Uso Obrigatório

Este projeto **NÃO suporta** o comando genérico `npm run build`. Use **sempre** um dos comandos específicos por locale:

```bash
npm run build:br   # Português Brasileiro (https://forjadesistemas.com.br)
npm run build:it   # Italiano (https://systemforge.it)
npm run build:en   # English (https://systemforgesoftware.com)
npm run build:es   # Español (https://systemforge.es)
```

## Por que isso?

O script de prebuild (`prebuild` em `package.json`) executa `generate:search-index`, que exige a variável de ambiente `NEXT_PUBLIC_LOCALE` definida. Os comandos específicos (`build:br`, `build:it`, `build:en`, `build:es`) definem isso automaticamente. O comando genérico `npm run build` não define, causando falha.

## Desenvolvimento Local

```bash
# Inicie o dev server (usa NEXT_PUBLIC_LOCALE padrão: pt-BR)
npm run dev

# Build para desenvolvimento (pt-BR)
NEXT_PUBLIC_LOCALE=pt-BR npm run build
```

## Produção (Build Multi-Locale)

```bash
# Build para todos os 4 locales (gera dist-br/, dist-it/, dist-en/, dist-es/)
npm run build:br && npm run build:it && npm run build:en && npm run build:es

# Ou executar o smoke test completo (valida SEO + hreflang)
npm run smoke:seo
```

## Docker Build

```bash
# Build containers para cada locale
npm run docker:build:br
npm run docker:build:it
npm run docker:build:en

# Ou iniciar containers em desenvolvimento
npm run docker:dev
```

## Variáveis de Ambiente por Locale

| Script | Locale | `NEXT_PUBLIC_LOCALE` | `NEXT_PUBLIC_SITE_URL` | `OUT_DIR` |
|--------|--------|----------------------|------------------------|-----------|
| `build:br` | 🇧🇷 | `pt-BR` | `https://forjadesistemas.com.br` | `dist-br/` |
| `build:it` | 🇮🇹 | `it-IT` | `https://systemforge.it` | `dist-it/` |
| `build:en` | 🇺🇸 | `en` | `https://systemforgesoftware.com` | `dist-en/` |

Estas variáveis são definidas **automaticamente** por cada script. Não é necessário defini-las manualmente.

## Troubleshooting

### ❌ Erro: "[ERRO]: NEXT_PUBLIC_LOCALE não definida"

```
[generate-search-index] ERRO: NEXT_PUBLIC_LOCALE não definida.
  Use: NEXT_PUBLIC_LOCALE=pt-BR npx tsx scripts/generate-search-index.ts
```

**Solução:** Use um dos comandos obrigatórios (`npm run build:br`, `npm run build:it`, `npm run build:en`) em vez de `npm run build`.

### ❌ Erro: "OUT_DIR não definido"

**Solução:** Similar à acima — sempre use os comandos específicos que definem `OUT_DIR`.

## Estrutura de Output

Após rodar os 3 builds, você terá:

```
dist-br/     → site para forjadesistemas.com.br (pt-BR)
dist-it/     → site para systemforge.it (it-IT)
dist-en/     → site para systemforgesoftware.com (en)
```

Cada uma é uma build **independente** e pronta para deploy.

---

**Documento gerado por:** `/skill:resolve-gaps` (GAP-002)
**Data:** 2026-03-28
