/**
 * scripts/fix-blog-whatsapp-locale.ts
 *
 * Codemod de uso unico: normaliza links de WhatsApp hardcoded na PROSA dos
 * artigos MDX para o numero canonico de CADA locale (config/sites/*.ts) e remove
 * o WhatsApp do es-ES (que nao tem numero por design -> vira link /contacto).
 *
 * Motivo: a geracao do blog injetava .claude/blog/config.json > whatsapp_cta_url
 * (apontando o numero BR para os 4 locales) e batches antigos deixaram numeros
 * placeholder (5500000000000, 393000000000, 34600000000, 15550000000, ...). Isso
 * violava o multi-whatsapp (numero errado/cross-locale; ES nao deve ter WhatsApp)
 * e deixava links quebrados. A fonte (config.json) ja foi corrigida; este script
 * limpa os artigos ja gerados.
 *
 * Uso (da raiz do repo system-forge-landing-page):
 *   npx tsx scripts/fix-blog-whatsapp-locale.ts            # dry-run (default)
 *   npx tsx scripts/fix-blog-whatsapp-locale.ts --apply    # escreve
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'

const APPLY = process.argv.includes('--apply')
const ROOT = process.cwd()

// Digit-strings canonicos (config/sites/*.ts; build.yml NAO seta os _SUFIXOS).
const NUM: Record<string, string | null> = {
  'pt-BR': '5512934859127',
  'it-IT': '393508751885',
  en: '17865891052',
  'es-ES': null, // ES nao tem WhatsApp (config/sites/es.ts whatsapp='')
}
// Path de contato por locale, usado quando removemos o WhatsApp (so es-ES).
const CONTACT: Record<string, string> = {
  'pt-BR': '/contato',
  'it-IT': '/contatto',
  en: '/contact',
  'es-ES': '/contacto',
}

// Link markdown cujo alvo e uma url wa.me. Captura: texto, digitos/X, ?query.
const LINK = /\[([^\]]*)\]\(https:\/\/wa\.me\/([0-9Xx]+)(\?[^)]*)?\)/g
// URL wa.me "nua" (fora de link markdown) — segundo passo p/ stragglers.
const BARE = /https:\/\/wa\.me\/([0-9Xx]+)(\?[^\s)\]]*)?/g

/** es-ES: remove o termo "WhatsApp" do texto da ancora (vira CTA de contato). */
function stripWhatsAppWord(text: string): string {
  let t = text
    .replace(/\s*(via|por|on|su|em|en|in|con|attraverso|tramite|directamente)?\s*WhatsApp\s*(→|->)?\s*$/i, '')
    .replace(/\s*(→|->)\s*$/, '')
    .replace(/[\s,;:·|—-]+$/, '')
    .trim()
  if (!t || /^whatsapp$/i.test(text.trim())) t = 'Contacta con SystemForge'
  return t
}

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
        if (num === null) return `[${stripWhatsAppWord(text)}](${CONTACT[loc]})`
        return `[${text}](https://wa.me/${num}${q || ''})`
      })
      // Stragglers: wa.me "nu" fora de link markdown. Para non-ES re-escrever a
      // mesma url ja corrigida pelo passo acima e no-op (string identica).
      out = out.replace(BARE, (_m, _digits: string, q = '') => {
        nBare++
        if (num === null) return CONTACT[loc]
        return `https://wa.me/${num}${q || ''}`
      })
      // es-ES: limpa "WhatsApp" como CANAL de contato no texto das ancoras (ES
      // nao tem WhatsApp). So frases-canal "por/en/via/su WhatsApp" (com conector),
      // preservando o resto do texto e qualquer cauda apos "—"/"->"/"→". NAO toca
      // WhatsApp como TOPICO ("de WhatsApp", "mi WhatsApp", "chatbot WhatsApp",
      // "WhatsApp Business API" -> links de artigo), pois esses nao tem conector.
      if (num === null) {
        out = out.replace(
          /\[([^\]]*?)\s+(?:por|en|vía|via|su|em)\s+WhatsApp(\s*(?:—|->|→)\s*[^\]]*)?\]/gi,
          (_m, pre: string, tail = '') => {
            nLink++
            return `[${pre.replace(/[\s,;:—-]+$/, '')}${tail}]`
          },
        )
        // Ancora literal "[WhatsApp](url)" -> CTA de contato neutro.
        out = out.replace(/\[WhatsApp\](\([^)]*\))/g, (_m, url: string) => {
          nLink++
          return `[Contacta con SystemForge]${url}`
        })
      }
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
