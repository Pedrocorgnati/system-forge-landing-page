# OG Images — Instruções para /create-assets

Estes são placeholders. Use `/create-assets` para gerar as versões finais com Nano Banana 2.

## og-br.png
- **Dimensões:** 1200×630px
- **Headline:** "Forja de Sistemas"
- **Subtítulo:** "Desenvolvimento de Software Sob Medida"
- **Cores:** azul primário (#2563EB) + fundo escuro
- **Idioma:** Português BR
- **Prompt para /create-assets:** @ASSET_PLACEHOLDER og-br-1200x630

## og-it.png
- **Dimensões:** 1200×630px
- **Headline:** "SystemForge"
- **Subtítulo:** "Sviluppo Software Su Misura"
- **Cores:** azul primário (#2563EB) + fundo escuro
- **Idioma:** Italiano
- **Prompt para /create-assets:** @ASSET_PLACEHOLDER og-it-1200x630

## og-en.png
- **Dimensões:** 1200×630px
- **Headline:** "SystemForge Software"
- **Subtítulo:** "Custom Software Development"
- **Cores:** azul primário (#2563EB) + fundo escuro
- **Idioma:** Inglês
- **Prompt para /create-assets:** @ASSET_PLACEHOLDER og-en-1200x630

## Notas
- Formato PNG 1200×630 (proporção 1.91:1 — padrão Open Graph)
- Converter para WebP após geração: `npm run optimize:og-images` (ou `bash scripts/optimize-og-images.sh`)
- Os arquivos `.webp` são opcionais — as tags OG referenciarem o `.png`
