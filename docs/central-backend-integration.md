# Integracao com backend central

Este projeto e publicado como `output: export`. Por isso, ele nao possui rotas
API em runtime no Next.js.

## Uso direto por CORS

Configure:

```env
NEXT_PUBLIC_CENTRAL_BACKEND_URL=https://www.corgnati.com
```

Use `src/lib/central-backend.ts`:

```ts
import { fetchCentralIntegrationContext } from "@/lib/central-backend";

const context = await fetchCentralIntegrationContext();
```

Dominios liberados no backend central:

- `forjadesistemas.com.br`
- `systemforge.es`
- `systemforge.it`
- `systemforgesoftware.com`

## Quando precisar de sessao/cookies

Para fluxos autenticados, publique um proxy no dominio do frontend e encaminhe:

`/api/central/* -> https://www.corgnati.com/api/*`

O proxy precisa injetar:

```http
x-forwarded-host: <dominio-publico-do-frontend>
x-forwarded-proto: https
x-tenant-frontend: <dominio-publico-do-frontend>
```
