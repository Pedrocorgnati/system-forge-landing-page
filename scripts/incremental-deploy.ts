/**
 * incremental-deploy.ts
 *
 * Deploy SFTP INCREMENTAL para os sites estáticos (quad-market). Em vez de
 * `lftp mirror` varrer/`stat`ar os ~36k arquivos do build a cada deploy (lento:
 * ~50 min), sobe apenas o DELTA desde o último deploy.
 *
 * Como: um manifesto de hashes (`{relpath: sha256}`) é guardado no próprio
 * servidor em `{SFTP_PATH}/.deploy-manifest.json`. A cada deploy:
 *   1. calcula o manifesto local (hash de cada arquivo de out/);
 *   2. baixa o manifesto remoto (o que está publicado hoje);
 *   3. diff -> arquivos a SUBIR (novos/alterados) e a APAGAR (sumiram do build);
 *   4. sobe só o delta + apaga os removidos, e por ÚLTIMO grava o novo manifesto
 *      (se o lftp falhar no meio, o manifesto antigo permanece -> o próximo run
 *      reprocessa o que faltou; idempotente).
 *
 * Bootstrap (sem manifesto remoto): faz um `mirror` completo uma vez e cria o
 * manifesto. Daí em diante os deploys são incrementais (segundos).
 *
 * Env: SFTP_HOST, SFTP_USER, LFTP_PASSWORD, SFTP_PORT, SFTP_PATH (public_html),
 *      OUT_DIR (default "out"), DEPLOY_PARALLEL (default "6"),
 *      FORCE_FULL_DEPLOY=1 (opcional: força mirror completo + regrava manifesto).
 *
 * O manifesto é bloqueado de acesso web pela regra em generate-htaccess.ts.
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import * as os from 'node:os'

const OUT = process.env.OUT_DIR || 'out'
const HOST = need('SFTP_HOST')
const USER = need('SFTP_USER')
const PASS = need('LFTP_PASSWORD')
const PORT = process.env.SFTP_PORT || '22'
const REMOTE = need('SFTP_PATH').replace(/\/+$/, '')
const PARALLEL = process.env.DEPLOY_PARALLEL || '6'
const MANIFEST = '.deploy-manifest.json'
// Acima deste nº de arquivos a subir, individual `put` perde para `mirror`.
const MIRROR_THRESHOLD = 4000

function need(k: string): string {
  const v = process.env[k]
  if (!v) { console.error(`[incr-deploy] env obrigatório ausente: ${k}`); process.exit(1) }
  return v
}

const LFTP_PREAMBLE = [
  'set sftp:auto-confirm yes',
  'set net:max-retries 5',
  'set net:timeout 30',
  'set net:reconnect-interval-base 5',
].join('; ')

/** Roda um script lftp (string de comandos) com até 3 tentativas. */
function runLftp(commands: string, label: string): void {
  const file = path.join(os.tmpdir(), `lftp-${process.pid}-${Date.now()}.txt`)
  fs.writeFileSync(file, `${LFTP_PREAMBLE};\n${commands}\nquit\n`)
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[incr-deploy] lftp ${label} — tentativa ${attempt}/3`)
        execFileSync('lftp', ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-f', file], {
          stdio: ['ignore', 'inherit', 'inherit'],
          maxBuffer: 1 << 28,
        })
        return
      } catch (e) {
        console.error(`[incr-deploy] ${label} falhou na tentativa ${attempt}: ${(e as Error).message}`)
        if (attempt === 3) throw e
        execFileSync('sleep', ['15'])
      }
    }
  } finally {
    fs.rmSync(file, { force: true })
  }
}

/** lftp que captura stdout (para o `get` do manifesto). Não lança se falhar. */
function tryLftpGet(remoteFile: string, localFile: string): boolean {
  const file = path.join(os.tmpdir(), `lftp-get-${process.pid}-${Date.now()}.txt`)
  fs.writeFileSync(file, `${LFTP_PREAMBLE};\nget "${remoteFile}" -o "${localFile}";\nquit\n`)
  try {
    execFileSync('lftp', ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-f', file], {
      stdio: ['ignore', 'ignore', 'ignore'],
      maxBuffer: 1 << 28,
    })
    return fs.existsSync(localFile)
  } catch {
    return false // manifesto ausente (bootstrap) ou erro de leitura
  } finally {
    fs.rmSync(file, { force: true })
  }
}

function lftpQuote(p: string): string {
  return `"${p.replace(/(["\\])/g, '\\$1')}"`
}

// ── 1. Manifesto local ──────────────────────────────────────────────────────
function walk(dir: string, base: string, acc: string[]): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, base, acc)
    else acc.push(path.relative(base, p))
  }
  return acc
}

if (!fs.existsSync(OUT)) { console.error(`[incr-deploy] OUT_DIR não existe: ${OUT}`); process.exit(1) }
const localFiles = walk(OUT, OUT, []).sort()
const local: Record<string, string> = {}
for (const rel of localFiles) {
  local[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, rel))).digest('hex')
}
console.log(`[incr-deploy] build local: ${localFiles.length} arquivos`)

// ── 2. Manifesto remoto (o que está publicado) ──────────────────────────────
let previous: Record<string, string> = {}
const FORCE_FULL = process.env.FORCE_FULL_DEPLOY === '1'
const tmpPrev = path.join(os.tmpdir(), `prev-manifest-${process.pid}.json`)
fs.rmSync(tmpPrev, { force: true })
if (!FORCE_FULL && tryLftpGet(`${REMOTE}/${MANIFEST}`, tmpPrev)) {
  try { previous = JSON.parse(fs.readFileSync(tmpPrev, 'utf8')) }
  catch { console.warn('[incr-deploy] manifesto remoto corrompido — tratando como bootstrap'); previous = {} }
  fs.rmSync(tmpPrev, { force: true })
}
const bootstrap = Object.keys(previous).length === 0
console.log(`[incr-deploy] manifesto remoto: ${bootstrap ? '(ausente -> bootstrap/full)' : Object.keys(previous).length + ' arquivos'}${FORCE_FULL ? ' [FORCE_FULL]' : ''}`)

// ── 3. Diff ─────────────────────────────────────────────────────────────────
const toUpload = localFiles.filter((f) => local[f] !== previous[f])
const toDelete = Object.keys(previous).filter((f) => !(f in local) && f !== MANIFEST)
console.log(`[incr-deploy] delta: subir=${toUpload.length} apagar=${toDelete.length} inalterados=${localFiles.length - toUpload.length}`)

// Grava o novo manifesto num arquivo temp para upload (sobe por último).
const tmpNew = path.join(os.tmpdir(), `new-manifest-${process.pid}.json`)
fs.writeFileSync(tmpNew, JSON.stringify(local))

const manifestPut = `put ${lftpQuote(tmpNew)} -o ${lftpQuote(`${REMOTE}/${MANIFEST}`)}`

// ── 4. Deploy ───────────────────────────────────────────────────────────────
if (bootstrap || toUpload.length > MIRROR_THRESHOLD) {
  // Full mirror (bootstrap ou mudança massiva). Mantém arquivos remotos extras
  // (sem --delete) para não arriscar; o manifesto passa a refletir o build.
  console.log(`[incr-deploy] estratégia: MIRROR completo (${bootstrap ? 'bootstrap' : toUpload.length + ' alterados > ' + MIRROR_THRESHOLD})`)
  runLftp(
    `mirror --reverse --parallel=${PARALLEL} --ignore-time --no-empty-dirs --log=/dev/stderr ${lftpQuote(OUT + '/')} ${lftpQuote(REMOTE)}`,
    'mirror',
  )
  runLftp(manifestPut, 'manifest')
} else if (toUpload.length === 0 && toDelete.length === 0) {
  console.log('[incr-deploy] nada mudou — só atualiza o manifesto (no-op de conteúdo)')
  runLftp(manifestPut, 'manifest')
} else {
  // Incremental: mkdir dos diretórios, put dos alterados, rm dos removidos.
  const dirs = [...new Set(toUpload.map((f) => path.posix.dirname(f)).filter((d) => d && d !== '.'))].sort()
  const cmds: string[] = []
  for (const d of dirs) cmds.push(`mkdir -p -f ${lftpQuote(`${REMOTE}/${d}`)}`)
  for (const f of toUpload) cmds.push(`put ${lftpQuote(path.join(OUT, f))} -o ${lftpQuote(`${REMOTE}/${f}`)}`)
  for (const f of toDelete) cmds.push(`rm -f ${lftpQuote(`${REMOTE}/${f}`)}`)
  cmds.push(manifestPut) // manifesto por ÚLTIMO
  console.log(`[incr-deploy] estratégia: INCREMENTAL (${dirs.length} mkdir, ${toUpload.length} put, ${toDelete.length} rm)`)
  runLftp(cmds.join(';\n'), 'incremental')
}

fs.rmSync(tmpNew, { force: true })
console.log('[incr-deploy] OK')
