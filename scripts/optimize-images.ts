/**
 * scripts/optimize-images.ts
 * Otimiza imagens para WebP em 3 breakpoints.
 * Uso: npx ts-node scripts/optimize-images.ts
 *
 * Gera: public/images/{name}_480.webp, {name}_768.webp, {name}_1280.webp
 */
import { glob } from 'glob'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const BREAKPOINTS = [
  { width: 480, suffix: '_480' },
  { width: 768, suffix: '_768' },
  { width: 1280, suffix: '_1280' },
]

const INPUT_PATTERNS = ['public/images/**/*.{jpg,jpeg,png}']
const QUALITY = 85

async function optimizeImages(): Promise<void> {
  const files = await glob(INPUT_PATTERNS)

  if (files.length === 0) {
    console.log('[optimize-images] Nenhuma imagem encontrada para otimizar.')
    return
  }

  let processed = 0
  let skipped = 0

  for (const file of files) {
    // Pular arquivos que já são WebP ou já têm sufixo de breakpoint
    if (file.endsWith('.webp') || /_\d+\.webp$/.test(file)) {
      skipped++
      continue
    }

    const ext = path.extname(file)
    const base = file.slice(0, -ext.length)

    for (const { width, suffix } of BREAKPOINTS) {
      const output = `${base}${suffix}.webp`

      // Pular se já existe (evitar reprocessamento desnecessário)
      try {
        await fs.access(output)
        continue
      } catch {
        // Arquivo não existe — processar
      }

      try {
        await sharp(file)
          .resize(width, undefined, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(output)

        console.log(`[optimize-images] ✓ ${output}`)
        processed++
      } catch (err) {
        console.error(`[optimize-images] ✗ Erro ao processar ${file}: ${err}`)
        process.exit(1)
      }
    }
  }

  console.log(`\n[optimize-images] Concluído: ${processed} WebPs gerados, ${skipped} ignorados.`)
}

optimizeImages()
