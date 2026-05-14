# Como Usar hreflang no Blog

## Implementação em cada página de artigo

No arquivo `app/blog/[slug]/page.tsx` de cada locale, importar e usar `getHreflangAlternates`:

```typescript
import { getHreflangAlternates } from '@/lib/hreflang'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // ... outros metadados ...
  
  return {
    title: articleTitle,
    description: articleDescription,
    alternates: {
      languages: getHreflangAlternates(params.slug),
    },
    // ... resto dos metadados ...
  }
}
```

## Estrutura do mapa hreflang

O mapa `public/hreflang-map.json` contém:

- **groups**: 263 grupos de artigos equivalentes entre locales
  - Cada grupo mapeia slugs idênticos entre pt-BR, it-IT, en, es-ES
  - URLs completas já incluídas para cada versão
  - x-default aponta para a versão em inglês (global)

- **exclusive**: 270 artigos exclusivos (sem equivalente em outro locale)
  - 131 em pt-BR (36%)
  - 48 em it-IT (17%)
  - 47 em en (16.7%)
  - 44 em es-ES (15.8%)

- **stats**: Cobertura de cada locale
  - Percentual de artigos que têm equivalente multilíngue

## Fluxo de atualização

Sempre que executar `/blog:deploy` para publicar novos artigos:

1. Novos artigos devem incluir `hreflang_pair` no frontmatter MDX
2. Exemplo de `hreflang_pair`:
   ```yaml
   hreflang_pair:
     - locale: "it-IT"
       slug: "slug-em-italiano"
     - locale: "en"
       slug: "slug-em-ingles"
     - locale: "es-ES"
       slug: "slug-em-espanhol"
   ```

3. Após publicar, executar `/blog:hreflang-map` para regenerar o mapa

## Benefícios

- **Sem canibalizacao SEO**: Google sabe qual versão servir para qual mercado
- **Signals consolidados**: Cada mercado acumula backlinks e ranking independente
- **Experiencia multilíngue**: Usuarios veem link para sua lingua
- **x-default global**: Fallback para en quando lingua do usuario nao é suportada

## Troubleshooting

**Artigo não aparece no mapa**
→ Verifique se tem `hreflang_pair` no frontmatter e se foi executado `/blog:hreflang-map`

**Slug mapeado errado**
→ Regenere o mapa: `/blog:hreflang-map`

**x-default não funciona**
→ Verifique se `NEXT_PUBLIC_LOCALE` está definido no `.env` de cada marketplace
