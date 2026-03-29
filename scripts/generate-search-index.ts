/**
 * scripts/generate-search-index.ts
 * Gera public/search-index.json a partir dos artigos do locale ativo.
 *
 * Lê `content/{NEXT_PUBLIC_LOCALE}/blog/*.mdx` e gera o index filtrado
 * para o build ativo. Como cada build usa OUT_DIR diferente (dist-br/, dist-it/, dist-en/),
 * os arquivos ficam isolados automaticamente.
 *
 * Uso:
 *   NEXT_PUBLIC_LOCALE=pt-BR npx tsx scripts/generate-search-index.ts
 *
 * Output: public/search-index.json
 *
 * Segurança: NEXT_PUBLIC_LOCALE é validado via allowlist em generateSearchIndex()
 * antes de ser interpolado em paths de filesystem (path traversal prevention).
 */
import fs from 'fs/promises'
import path from 'path'
import type { SupportedLocale } from '../config/types'
import { generateSearchIndex } from '../src/lib/search'

const ALLOWED_LOCALES: readonly SupportedLocale[] = ['pt-BR', 'it-IT', 'en', 'es-ES'] as const

async function run(): Promise<void> {
  const rawLocale = process.env.NEXT_PUBLIC_LOCALE

  if (!rawLocale) {
    console.error(
      '[generate-search-index] ERRO: NEXT_PUBLIC_LOCALE não definida.\n' +
        '  Use: NEXT_PUBLIC_LOCALE=pt-BR npx tsx scripts/generate-search-index.ts',
    )
    process.exit(1)
  }

  if (!ALLOWED_LOCALES.includes(rawLocale as SupportedLocale)) {
    console.error(
      `[generate-search-index] ERRO: NEXT_PUBLIC_LOCALE="${rawLocale}" inválida.\n` +
        `  Valores permitidos: ${ALLOWED_LOCALES.join(', ')}`,
    )
    process.exit(1)
  }

  const locale = rawLocale as SupportedLocale

  const index = generateSearchIndex(locale)

  await fs.mkdir(path.join(process.cwd(), 'public'), { recursive: true })
  await fs.writeFile(
    path.join(process.cwd(), 'public', 'search-index.json'),
    JSON.stringify(index, null, 2),
  )

  console.log(
    `[generate-search-index] ✓ ${index.length} artigos indexados em public/search-index.json (locale: ${locale})`,
  )
}

run()
