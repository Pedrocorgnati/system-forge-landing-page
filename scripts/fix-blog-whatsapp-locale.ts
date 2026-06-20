/**
 * scripts/fix-blog-whatsapp-locale.ts
 *
 * Codemod de uso unico: normaliza TODO link de WhatsApp hardcoded na PROSA dos
 * artigos MDX para o numero canonico de CADA locale. ES reusa a linha da ITALIA
 * (decisao do operador 2026-06-20) — ES TEM WhatsApp, com o numero italiano.
 *
 * Motivo: a geracao do blog injetava .claude/blog/config.json > whatsapp_cta_url
 * (apontando o numero BR para os 4 locales) e batches antigos deixaram numeros
 * placeholder (5500000000000, 393000000000, 34600000000, 34000000000, ...). Isso
 * violava o multi-whatsapp (numero errado/cross-locale) e deixava links quebrados.
 * A fonte (config.json + config/sites/*.ts) ja foi corrigida; este script limpa os
 * artigos ja gerados. So toca o ALVO wa.me — links de contato genuinos (/contato,
 * /contacto, etc.) ficam intactos.
 *
 * Uso (da raiz do repo system-forge-landing-page):
 *   npx tsx scripts/fix-blog-whatsapp-locale.ts            # dry-run (default)
 *   npx tsx scripts/fix-blog-whatsapp-locale.ts --apply    # escreve
 *
 * NOTA es-ES: como o codemod anterior ja havia REMOVIDO o wa.me do es-ES (-> /contacto),
 * restaure os artigos originais antes de rodar com ES agora apontando p/ a linha IT:
 *   git checkout 0d981f3 -- content/es-ES/blog/ && npx tsx scripts/fix-blog-whatsapp-locale.ts --apply
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const APPLY = process.argv.includes('--apply')
const ROOT = process.cwd()

// Digit-strings canonicos por locale (config/sites/*.ts; build.yml NAO seta os
// _SUFIXOS, entao os fallbacks .ts valem). ES reusa a linha IT (+393508751885).
const NUM: Record<string, string> = {
  'pt-BR': '5512934859127',
  'it-IT': '393508751885',
  en: '17865891052',
  'es-ES': '393508751885',
}

// Link markdown cujo alvo e uma url wa.me. Captura: texto, digitos/X, ?query.
const LINK = /\[([^\]]*)\]\(https:\/\/wa\.me\/([0-9Xx]+)(\?[^)]*)?\)/g
// URL wa.me "nua" (fora de link markdown) — segundo passo p/ stragglers.
const BARE = /https:\/\/wa\.me\/([0-9Xx]+)(\?[^\s)\]]*)?/g

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (e.name.endsWith('.mdx')) out.push(p)
  }
  return out
}

async function main(): Promise<void> {
  let changedFiles = 0
  let changedLinks = 0
  let changedBare = 0
  for (const loc of Object.keys(NUM)) {
    const num = NUM[loc]
    const files = await walk(path.join(ROOT, 'content', loc, 'blog'))
    for (const f of files) {
      const src = await fs.readFile(f, 'utf8')
      let nLink = 0
      let nBare = 0
      let out = src.replace(LINK, (_m, text: string, _digits: string, q = '') => {
        nLink++
        return `[${text}](https://wa.me/${num}${q || ''})`
      })
      // Stragglers: wa.me "nu" fora de link markdown (re-escrever url ja correta
      // e no-op — string identica).
      out = out.replace(BARE, (_m, _digits: string, q = '') => {
        nBare++
        return `https://wa.me/${num}${q || ''}`
      })
      if (out !== src) {
        changedFiles++
        changedLinks += nLink
        changedBare += nBare
        if (APPLY) await fs.writeFile(f, out, 'utf8')
        else console.log(`[dry] ${path.relative(ROOT, f)} (${nLink} link, ${nBare} bare)`)
      }
    }
  }
  console.log(`\n${APPLY ? 'APPLIED' : 'DRY-RUN'}: ${changedFiles} files changed (${changedLinks} md-links, ${changedBare} bare-url matches)`)
  if (!APPLY) console.log('Re-rode com --apply para gravar.')
}

void main()
