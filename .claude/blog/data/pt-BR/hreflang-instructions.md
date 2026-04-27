# Como Usar hreflang no Blog — SystemForge Quad-Market

Gerado em: 2026-04-17

## Em cada página de artigo (app/blog/[slug]/page.tsx)

```typescript
import { getHreflangAlternates } from '@/lib/hreflang'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    // ... outros metadados
    alternates: {
      languages: getHreflangAlternates(params.slug),
    },
  }
}
```

## Regenerar após cada lote de deploy

Execute `/blog:hreflang-map` após cada `/blog:deploy` para manter o mapa atualizado.

## Cobertura atual (2026-04-17)

| Locale | Total | Em grupos | Cobertura |
|--------|-------|-----------|-----------|
| pt-BR  | 242   | 140       | 57.9%     |
| it-IT  | 160   | 135       | 84.4%     |
| en     | 160   | 135       | 84.4%     |
| es-ES  | 160   | 135       | 84.4%     |

- **Grupos cross-locale:** 226
- **Exclusivos (sem equivalente):** pt-BR=102, it-IT=25, en=25, es-ES=25

## Arquivos

- `public/hreflang-map.json` — mapa completo (226 grupos)
- `src/lib/hreflang.ts` — helpers `getHreflangLinks()` e `getHreflangAlternates()`
