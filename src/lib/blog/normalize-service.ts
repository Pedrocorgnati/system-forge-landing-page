/**
 * src/lib/blog/normalize-service.ts
 *
 * Normaliza o campo `relatedService` do frontmatter de posts MDX para um valor
 * canonico de `ServiceCategory` (ou `undefined`).
 *
 * MOTIVO: o pipeline de conteudo (routine blog-daily) escreve `relatedService`
 * livremente nos 4 locales, sem validar contra o enum canonico. O resultado
 * historico foi ~48 valores distintos — muitos invalidos (variantes de "custom
 * systems", "web development", "business automation", "system maintenance" em
 * pt/it/en/es). Com `s.enum(...)` no velite e SEM `strict`, esses posts eram
 * SILENCIOSAMENTE DESCARTADOS do build (404 em producao com build verde). Ver
 * rules/auto-publishable-blog.md.
 *
 * ESTRATEGIA: o schema velite passa a aceitar `s.string()` cru e esta funcao
 * normaliza no `.transform()`:
 *   - valor ja canonico            -> passa direto
 *   - sinonimo verdadeiro (alias)  -> mapeia para o canonico
 *   - ambiguo / sem categoria real -> `undefined` (CTA padrao, link contextual
 *                                     omitido — degradacao graciosa, sem link
 *                                     quebrado para /servicos/[slug] inexistente)
 *
 * Apenas SINONIMOS VERDADEIROS sao mapeados. Clusters ambiguos
 * ("sistemas-personalizados", "desenvolvimento-web", "automacao-empresarial",
 * manutencao) caem em `undefined` de proposito: chutar um /servicos/[slug]
 * errado em centenas de artigos e pior que nao ter link contextual.
 *
 * Modulo livre de dependencias de framework — importavel pelo velite (caminho
 * relativo, fora do bundler do Next) e por scripts/app code.
 */
import { ServiceCategory } from '../types'

/** Conjunto dos 13 valores canonicos de ServiceCategory. */
export const CANONICAL_SERVICES: ReadonlySet<string> = new Set<string>(
  Object.values(ServiceCategory),
)

/**
 * Mapa de aliases — SOMENTE sinonimos verdadeiros de uma categoria canonica.
 * Chaves ja normalizadas (lowercase, hifens). Nao incluir clusters ambiguos.
 */
const SERVICE_ALIASES: Readonly<Record<string, ServiceCategory>> = {
  // Mobile — variantes pt/it/en/es de "aplicativo mobile"
  'aplicativos-mobile': ServiceCategory.MOBILE,
  'app-mobile': ServiceCategory.MOBILE,
  'app-movil': ServiceCategory.MOBILE,
  'apps-moviles': ServiceCategory.MOBILE,
  'mobile-apps': ServiceCategory.MOBILE,
  // Automacao com IA — variantes de "automacao IA" / "agentes IA"
  'automacao-ia': ServiceCategory.AI,
  'automatizacion-ia': ServiceCategory.AI,
  'automazione-ia': ServiceCategory.AI,
  'agentes-ia': ServiceCategory.AI,
  // Consultoria — variantes de "consultoria tecnica"
  'consultoria-tecnica': ServiceCategory.CONSULTORIA,
  'consulenza-tecnica': ServiceCategory.CONSULTORIA,
  'technical-consulting': ServiceCategory.CONSULTORIA,
  // ERP — variante "ERP para PMI"
  'erp-pmi': ServiceCategory.ERP,
}

/**
 * Canonicaliza a forma textual de um valor: trim, lowercase, espacos e
 * underscores viram hifen, hifens repetidos colapsam. Idempotente — evita que
 * o mapa de aliases precise crescer para cada variacao de formatacao.
 */
function canonicalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Normaliza `relatedService` cru para um `ServiceCategory` canonico ou
 * `undefined`. Nunca lanca — entradas vazias/desconhecidas viram `undefined`.
 */
export function normalizeRelatedService(
  value: string | undefined | null,
): ServiceCategory | undefined {
  if (!value || typeof value !== 'string') return undefined
  const key = canonicalizeKey(value)
  if (!key) return undefined
  if (CANONICAL_SERVICES.has(key)) return key as ServiceCategory
  return SERVICE_ALIASES[key]
}

/**
 * True se o valor cru ja for um `ServiceCategory` canonico. Usado por
 * validate-frontmatter.ts para reportar drift do pipeline sem bloquear o CI.
 */
export function isCanonicalService(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false
  return CANONICAL_SERVICES.has(canonicalizeKey(value))
}
