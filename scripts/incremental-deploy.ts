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
  // CRÍTICO: sem isto o lftp sai 0 mesmo com put/mirror/rm parcialmente falho
  // (o último comando é `quit`) -> deploy "verde" mas site velho + manifesto
  // gravado em cima de um upload incompleto (quebra a idempotência). Com
  // fail-exit, a falha propaga -> retry 3x engata, o step do CI falha, e o
  // manifesto antigo sobrevive p/ o próximo run reenviar o que faltou.
  'set cmd:fail-exit yes',
  'set sftp:auto-confirm yes',
  'set net:max-retries 5',
  'set net:timeout 30',
  'set net:reconnect-interval-base 5',
].join('; ')

/** Roda um script lftp (string de comandos) com até 3 tentativas.
 * Usa a forma `lftp -u user,pass host -e "source FILE; quit"` (idêntica à do
 * deploy legado que funcionava): `-f` com host é inválido ("Usage: lftp ...").
 * `source` lê os comandos do arquivo (evita limite de tamanho de arg). */
function runLftp(commands: string, label: string): void {
  const file = path.join(os.tmpdir(), `lftp-${process.pid}-${Date.now()}.txt`)
  fs.writeFileSync(file, `${LFTP_PREAMBLE};\n${commands}\n`)
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[incr-deploy] lftp ${label} — tentativa ${attempt}/3`)
        execFileSync('lftp', ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-e', `source ${file}; quit`], {
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

/** lftp `get` do manifesto. Não lança se falhar (ausente = bootstrap). */
function tryLftpGet(remoteFile: string, localFile: string): boolean {
  try {
    execFileSync('lftp', ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-e', `${LFTP_PREAMBLE}; get "${remoteFile}" -o "${localFile}"; quit`], {
      stdio: ['ignore', 'ignore', 'ignore'],
      maxBuffer: 1 << 28,
    })
    return fs.existsSync(localFile)
  } catch {
    return false // manifesto ausente (bootstrap) ou erro de leitura
  }
}

function lftpQuote(p: string): string {
  return `"${p.replace(/(["\\])/g, '\\$1')}"`
}

/** Roda comandos lftp em best-effort (1 tentativa, não lança). Para limpezas
 * onde a falha não deve abortar o deploy (ex.: purga de diretórios renomeados). */
function runLftpBestEffort(commands: string, label: string): void {
  const file = path.join(os.tmpdir(), `lftp-be-${process.pid}-${Date.now()}.txt`)
  fs.writeFileSync(file, `${LFTP_PREAMBLE};\n${commands}\n`)
  try {
    execFileSync('lftp', ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-e', `source ${file}; quit`], {
      stdio: ['ignore', 'inherit', 'inherit'], maxBuffer: 1 << 28,
    })
  } catch (e) {
    console.warn(`[incr-deploy] ${label} (best-effort) falhou, seguindo: ${(e as Error).message}`)
  } finally {
    fs.rmSync(file, { force: true })
  }
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

// Fail-closed: build vazio ou sem .htaccess = artefato quebrado. Deployar
// apagaria conteúdo / quebraria o site (a máquina de delete removeria o
// .htaccess vivo com toda a config de HTTPS/CSP/rewrites).
if (localFiles.length === 0) { console.error('[incr-deploy] ABORTA: build vazio (0 arquivos)'); process.exit(1) }
if (!('.htaccess' in local)) { console.error('[incr-deploy] ABORTA: out/.htaccess ausente (build incompleto)'); process.exit(1) }

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
// NUNCA apaga o manifesto nem o .htaccess (não estão em out/ na ordem normal,
// mas se algum dia entrarem no manifesto, um build sem eles os apagaria).
const PROTECTED = new Set([MANIFEST, '.htaccess'])
const toDelete = Object.keys(previous).filter((f) => !(f in local) && !PROTECTED.has(f))
console.log(`[incr-deploy] delta: subir=${toUpload.length} apagar=${toDelete.length} inalterados=${localFiles.length - toUpload.length}`)

// Guarda anti-catástrofe: fora do bootstrap, se o delta apagaria >30% do
// publicado, o artefato/manifesto está suspeito — aborta (use FORCE_FULL_DEPLOY=1
// para um re-sync intencional via mirror não-destrutivo).
const prevCount = Object.keys(previous).length
if (!bootstrap && prevCount > 0 && toDelete.length / prevCount > 0.30) {
  console.error(`[incr-deploy] ABORTA: apagaria ${toDelete.length}/${prevCount} (>30%) — suspeito. Use FORCE_FULL_DEPLOY=1 se intencional.`)
  process.exit(1)
}

// Grava o novo manifesto num arquivo temp para upload (sobe por último).
const tmpNew = path.join(os.tmpdir(), `new-manifest-${process.pid}.json`)
fs.writeFileSync(tmpNew, JSON.stringify(local))

// Escrita "atômica" do manifesto: put no .tmp + rename server-side. ATENÇÃO:
// o SFTP rename (lftp `mv`) NÃO sobrescreve um destino existente no servidor da
// Hostinger -> falha "Access failed: Failure" em TODO deploy pós-bootstrap (o
// manifesto já existe). Por isso `rm -f` do manifesto atual ANTES do `mv`. O
// .tmp continua sendo escrito por completo e só então renomeado (sem arquivo
// final truncado). Janela rm→mv: se a conexão cair entre os dois, o manifesto
// fica ausente -> o próximo run vira bootstrap (mirror completo, seguro), nunca
// lê um manifesto pela metade.
const manifestPut =
  `put ${lftpQuote(tmpNew)} -o ${lftpQuote(`${REMOTE}/${MANIFEST}.tmp`)};\n` +
  `rm -f ${lftpQuote(`${REMOTE}/${MANIFEST}`)};\n` +
  `mv ${lftpQuote(`${REMOTE}/${MANIFEST}.tmp`)} ${lftpQuote(`${REMOTE}/${MANIFEST}`)}`

// ── 4. Deploy ───────────────────────────────────────────────────────────────
if (bootstrap || toUpload.length > MIRROR_THRESHOLD) {
  // Full mirror (bootstrap ou mudança massiva). Mantém arquivos remotos extras
  // (sem --delete) para não arriscar; o manifesto passa a refletir o build.
  console.log(`[incr-deploy] estratégia: MIRROR completo (${bootstrap ? 'bootstrap' : toUpload.length + ' alterados > ' + MIRROR_THRESHOLD})`)
  if (bootstrap) {
    // Sem manifesto remoto, o mirror (sem --delete) NÃO remove as árvores
    // pré-slugify com %20 (blog/categoria/<react%20native>, blog/tag/<...>) ->
    // continuariam 404. Purga só essas árvores renomeáveis; o mirror logo abaixo
    // repovoa com os caminhos slugificados. Best-effort (ausência é ok).
    runLftpBestEffort(
      `rm -rf ${lftpQuote(`${REMOTE}/blog/categoria`)}; rm -rf ${lftpQuote(`${REMOTE}/blog/tag`)}`,
      'purge-renamed-dirs',
    )
  }
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
