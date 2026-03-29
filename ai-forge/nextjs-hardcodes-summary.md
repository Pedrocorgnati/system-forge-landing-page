# Hardcodes Summary

**Data:** 2026-03-29 | **Veredito:** ✅ APROVADO

| Categoria | Encontrados | Corrigidos |
|-----------|-------------|------------|
| Rotas hardcoded | 5 | 5 |
| Analytics event names | 3 | 3 |
| Magic numbers | 5 | 5 |
| Storage keys | 3 | 3 |
| **Total** | **16** | **16** |

## Constantes criadas

- `src/lib/constants/analytics.ts` → `GA4_EVENTS`
- `src/lib/constants/timing.ts` → `TIMING`
- `src/lib/constants/storage-keys.ts` → `STORAGE_KEYS`

## Destaque crítico

`href="/servicos"` em `src/app/servicos/[slug]/error.tsx` causaria rota quebrada nos builds IT (`/servizi`) e EN (`/services`). Corrigido para `ROUTES.SERVICES` (locale-aware).

## Checklist

- [x] Rotas de navegação centralizadas em ROUTES
- [x] Analytics events centralizados em GA4_EVENTS
- [x] Timeouts/debounce centralizados em TIMING
- [x] Storage keys centralizadas em STORAGE_KEYS
- [x] Barrel export atualizado
- [x] Sem erros TS novos introduzidos
- [x] Sem strings de rota literais restantes
- [x] Sem magic numbers de timer restantes
