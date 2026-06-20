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
import { execFileSync, spawnSync } from 'node:child_process'
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

type GetResult = 'OK' | 'NOT_FOUND'

/** Classifica a stderr de uma falha do lftp em "ausência genuína" vs "erro de
 * rede/transiente". Conservador: o que não casar como ausência é tratado como
 * transiente (logo, retry), porque um full-mirror indevido é muito mais caro que
 * uma tentativa a mais. */
function isGenuineAbsence(stderr: string): boolean {
  const s = stderr.toLowerCase()
  return (
    /no such file/.test(s) ||
    /file not found/.test(s) ||
    /access failed:.*no such/.test(s) ||
    /permission denied/.test(s) || // inacessível p/ este user -> trate como "sem manifesto"
    /access denied/.test(s)
  )
}

/** Sonda leve de existência do manifesto remoto (sem baixar os ~3-4MB). Usa
 * `cls -1` (listagem só-nomes) do caminho exato. Retorna:
 *   true  -> existe (status 0 + 1+ linha listada);
 *   false -> ausente (erro "no such file" OU cls falhou sem ruído de rede);
 *   null  -> indeterminado (erro de rede na própria sonda) -> NÃO concluir nada. */
function probeLftpExists(remoteFile: string): boolean | null {
  const r = spawnSync(
    'lftp',
    ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-e', `${LFTP_PREAMBLE}; cls -1 "${remoteFile}"; quit`],
    { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28, encoding: 'utf8' },
  )
  const out = (r.stdout || '').trim()
  const err = (r.error ? r.error.message : '') + (r.stderr || '')
  if (r.status === 0 && out.length > 0) return true
  if (isGenuineAbsence(err) || (r.status !== 0 && out.length === 0 && err.trim().length === 0)) return false
  return null
}

/** lftp `get` do manifesto, COM retry (3x, backoff 15s — espelha runLftp).
 * Distingue ausência genuína de falha transiente:
 *   - "no such file"/permission denied -> NOT_FOUND imediato (bootstrap real);
 *   - erro de rede                      -> retry; esgotadas as 3 tentativas, faz
 *     uma sonda `cls`: só vira NOT_FOUND se a sonda disser AUSENTE; se a sonda
 *     disser PRESENTE ou for indeterminada, LANÇA (deploy falha alto em vez de
 *     full-mirror silencioso sobre um glitch de rede).
 * Apaga qualquer download parcial a cada falha p/ um arquivo truncado nunca ser
 * lido como sucesso (a guarda JSON.parse do chamador continua valendo também). */
// PACIENCIA proposital: a Hostinger (shared) estrangula a banda da conta por
// ~20min APOS uma sessao SFTP pesada (ex.: o mirror de transicao de um mercado).
// Nesse intervalo o GET do manifesto de 3-4MB estola (timeout) e morre com
// "max-retries exceeded". Como o deploy e serializado (br->it->en->es), o GET de
// um mercado pode cair na sombra do estrangulamento do mercado anterior. 10
// tentativas x ~3min (net:max-retries do lftp) + backoff ~= ~30min, o suficiente
// p/ ESPERAR a banda voltar e o GET passar — sem cooldown manual nem full-mirror
// indevido. Em deploys leves (diario do blog) nao ha sessao pesada, entao o GET
// passa na 1a tentativa e nao ha espera nenhuma.
const GET_ATTEMPTS = 10
const GET_BACKOFF_S = 20
function tryLftpGet(remoteFile: string, localFile: string): GetResult {
  let lastErr = ''
  for (let attempt = 1; attempt <= GET_ATTEMPTS; attempt++) {
    const r = spawnSync(
      'lftp',
      ['-u', `${USER},${PASS}`, `sftp://${HOST}:${PORT}`, '-e', `${LFTP_PREAMBLE}; get "${remoteFile}" -o "${localFile}"; quit`],
      { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1 << 28, encoding: 'utf8' },
    )
    if (r.status === 0 && fs.existsSync(localFile)) {
      console.log(`[incr-deploy] manifesto remoto baixado (tentativa ${attempt}/${GET_ATTEMPTS})`)
      return 'OK'
    }
    fs.rmSync(localFile, { force: true }) // limpa parcial p/ não confundir existsSync nem JSON.parse
    lastErr = (r.error ? r.error.message + '\n' : '') + (r.stderr || '')
    if (isGenuineAbsence(lastErr)) {
      console.log('[incr-deploy] manifesto remoto ausente (lftp: no such file) -> bootstrap')
      return 'NOT_FOUND'
    }
    console.error(`[incr-deploy] get manifesto falhou (tentativa ${attempt}/${GET_ATTEMPTS}, transiente/estrangulado): ${lastErr.trim().slice(0, 300)}`)
    if (attempt < GET_ATTEMPTS) execFileSync('sleep', [String(GET_BACKOFF_S)])
  }
  console.error(`[incr-deploy] get do manifesto falhou ${GET_ATTEMPTS}x (~30min) — sondando existência via cls antes de decidir bootstrap`)
  const exists = probeLftpExists(remoteFile)
  if (exists === false) {
    console.log('[incr-deploy] sonda confirma manifesto AUSENTE -> bootstrap legítimo')
    return 'NOT_FOUND'
  }
  throw new Error(
    `[incr-deploy] manifesto remoto NÃO baixou após ${GET_ATTEMPTS} tentativas (~30min) e a sonda ` +
    `${exists === true ? 'confirma que ELE EXISTE' : 'foi indeterminada (rede instável)'}. ` +
    `Abortando p/ NÃO disparar full-mirror indevido. Último erro: ${lastErr.trim().slice(0, 300)}`,
  )
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
if (!FORCE_FULL && tryLftpGet(`${REMOTE}/${MANIFEST}`, tmpPrev) === 'OK') {
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
// Princípio comum a todos os caminhos: NUNCA usar --ignore-time. Com
// --ignore-time o lftp compara só TAMANHO e PULA arquivos do mesmo tamanho — mas
// uma página HTML cujo único diff é o hash de um asset `_next/static/<hash>`
// (mesmo comprimento -> mesmo tamanho) não seria reenviada, ficando com CSS/JS
// velhos; pior, o manifesto é gravado com os hashes LOCAIS de qualquer jeito, e
// o servidor dessincroniza em silêncio (staleness permanente). Sem --ignore-time
// o lftp usa mtime, e todo arquivo recém-criado no runner é mais novo que o
// remoto -> sobe de fato.
if (bootstrap) {
  // Bootstrap: sem manifesto remoto, espelha o build inteiro de out/.
  console.log('[incr-deploy] estratégia: BOOTSTRAP (mirror completo de out/)')
  // O mirror (sem --delete) NÃO remove as árvores pré-slugify com %20
  // (blog/categoria/<react%20native>, blog/tag/<...>) -> continuariam 404. Purga
  // só essas árvores renomeáveis; o mirror logo abaixo repovoa slugificado.
  runLftpBestEffort(
    `rm -rf ${lftpQuote(`${REMOTE}/blog/categoria`)}; rm -rf ${lftpQuote(`${REMOTE}/blog/tag`)}`,
    'purge-renamed-dirs',
  )
  runLftp(
    `mirror --reverse --parallel=${PARALLEL} --no-empty-dirs --log=/dev/stderr ${lftpQuote(OUT + '/')} ${lftpQuote(REMOTE)}`,
    'mirror',
  )
  runLftp(manifestPut, 'manifest')
} else if (toUpload.length === 0 && toDelete.length === 0) {
  console.log('[incr-deploy] nada mudou — só atualiza o manifesto (no-op de conteúdo)')
  runLftp(manifestPut, 'manifest')
} else if (toUpload.length > MIRROR_THRESHOLD) {
  // Mudança massiva: subir só o DELTA, mas em PARALELO. `mirror out/` espelharia
  // os ~35k arquivos do build inteiro (mtime fresco => sobe tudo) e estoura o
  // timeout-minutes do job no maior mercado (BR já bateu 90 min). Em vez disso,
  // monta uma árvore temporária só com os arquivos alterados (toUpload) e dá
  // `mirror` NELA: arquivos do stage têm mtime recém-criado -> todos sobem
  // (inclui os de mesmo tamanho com conteúdo novo) e SÓ eles -> rápido e correto.
  const stage = path.join(os.tmpdir(), `stage-${process.pid}`)
  fs.rmSync(stage, { recursive: true, force: true })
  for (const f of toUpload) {
    const dest = path.join(stage, f)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(OUT, f), dest)
  }
  console.log(`[incr-deploy] estratégia: DELTA-MIRROR (${toUpload.length} alterados via stage, ${toDelete.length} a apagar)`)
  try {
    runLftp(
      `mirror --reverse --parallel=${PARALLEL} --no-empty-dirs --log=/dev/stderr ${lftpQuote(stage + '/')} ${lftpQuote(REMOTE)}`,
      'mirror-delta',
    )
    if (toDelete.length > 0) {
      runLftp(toDelete.map((f) => `rm -f ${lftpQuote(`${REMOTE}/${f}`)}`).join(';\n'), 'deletes')
    }
    runLftp(manifestPut, 'manifest')
  } finally {
    fs.rmSync(stage, { recursive: true, force: true })
  }
} else {
  // Incremental pequeno: mkdir dos diretórios, put dos alterados, rm dos removidos.
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
