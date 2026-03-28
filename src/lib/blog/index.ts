/**
 * src/lib/blog/index.ts
 * Barrel export do módulo blog.
 *
 * Import via: import { PostFrontmatterSchema } from '@/lib/blog'
 *
 * INT-045: Contrato central para module-7 (artigos) e module-14 (validação final).
 */

export {
  PostFrontmatterSchema,
  hreflangPairSchema,
  SupportedLocaleSchema,
} from './post-schema'

export type {
  PostFrontmatter,
  HreflangPair,
  SupportedLocale,
} from './post-schema'

export type { ComputedFields } from './types'
