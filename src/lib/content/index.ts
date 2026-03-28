/**
 * src/lib/content/index.ts
 * Barrel export único para toda a content layer.
 *
 * Uso: import { MessagesSchema, type Messages, loadContent } from '@/lib/content'
 *
 * O schemaMap interno do content-loader NÃO é exportado aqui —
 * apenas a função pública loadContent é exposta.
 */

export * from './schemas'
export * from './types'
export { loadContent } from './content-loader'
