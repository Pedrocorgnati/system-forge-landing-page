/**
 * scripts/generate-search-index.ts
 * Gera public/search-index.json a partir dos artigos compilados pelo Velite.
 * Usado pelo Fuse.js no client para busca (module-7).
 * Uso: npx ts-node scripts/generate-search-index.ts
 *
 * Output: public/search-index.json
 */
import fs from 'fs/promises'
import path from 'path'

interface SearchIndexEntry {
  slug: string
  title: string
  description: string
  tags: string[]
  date: string
  relatedService?: string
}

async function generateSearchIndex(): Promise<void> {
  const veliteOutputPath = path.join(process.cwd(), '.velite', 'blog.json')

  // Verificar se Velite foi executado
  try {
    await fs.access(veliteOutputPath)
  } catch {
    console.log('[generate-search-index] .velite/blog.json não encontrado.')
    console.log('[generate-search-index] Execute `npx velite build` primeiro.')
    // Gerar arquivo vazio para não bloquear o build
    await fs.mkdir('public', { recursive: true })
    await fs.writeFile('public/search-index.json', JSON.stringify([]))
    console.log('[generate-search-index] Gerado public/search-index.json vazio.')
    process.exit(0)
  }

  const rawData = await fs.readFile(veliteOutputPath, 'utf-8')
  const articles = JSON.parse(rawData) as Array<{
    slug: string
    title: string
    description?: string
    tags?: string[]
    date: string
    relatedService?: string
  }>

  const index: SearchIndexEntry[] = articles.map(article => ({
    slug: article.slug,
    title: article.title,
    description: article.description ?? '',
    tags: article.tags ?? [],
    date: article.date,
    relatedService: article.relatedService,
  }))

  await fs.mkdir('public', { recursive: true })
  await fs.writeFile('public/search-index.json', JSON.stringify(index, null, 2))

  console.log(`[generate-search-index] ✓ ${index.length} artigos indexados em public/search-index.json`)
}

generateSearchIndex()
