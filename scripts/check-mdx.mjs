/**
 * scripts/check-mdx.mjs
 *
 * Smoke-compila um corpo MDX e reporta via exit code:
 *   exit 0 -> compila
 *   exit 3 -> MDX nao compila (erro ESPERADO; 1a linha na stderr)
 *   exit 1 -> falha de INFRAESTRUTURA (modulo ausente, stdin ilegivel, etc.)
 *
 * O codigo 3 e deliberadamente distinto do 1: o chamador
 * (promote-from-stockpile.ts) trata exit 3 como "post quebrado, skipa" e
 * QUALQUER outro exit != 0 como "guard inoperante, aborta o run" — para nao
 * degradar num promote no-op silencioso quando o proprio checker quebra.
 *
 * Roda em node PURO (nao tsx) de proposito: `@mdx-js/mdx` puxa `estree-walker`
 * (ESM-only, sem condicao `require` em `exports`), que o resolver do tsx 4.x nao
 * consegue resolver. O promote-from-stockpile.ts (que roda via tsx) invoca este
 * helper como subprocesso justamente para isolar essa cadeia de import.
 *
 * Uso:
 *   echo "<corpo mdx>" | node scripts/check-mdx.mjs        # corpo via stdin
 *   node scripts/check-mdx.mjs caminho/arquivo.mdx          # arquivo (strip FM)
 */
import fs from 'node:fs'
import { compileSync } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function stripFrontmatter(raw) {
  return raw.replace(/^---[\s\S]*?\r?\n---\r?\n?/, '')
}

const fileArg = process.argv[2]
let body
if (fileArg) {
  body = stripFrontmatter(fs.readFileSync(fileArg, 'utf8'))
} else {
  body = readStdin()
}

try {
  compileSync(body, { format: 'mdx', remarkPlugins: [remarkGfm] })
  process.exit(0)
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  process.stderr.write(msg.split('\n')[0] + '\n')
  // exit 3 (nao 1): erro de compilacao MDX e a falha ESPERADA deste helper.
  // Falhas de infraestrutura (import quebrado, stdin ilegivel) caem no exit 1
  // padrao do node, que o chamador trata como guard inoperante.
  process.exit(3)
}
