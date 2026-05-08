/**
 * scripts/validate-stockpile-mutations.ts
 *
 * Pre-commit hook: valida invariantes de mutação do Stockpile V2.
 *
 * Enforça (via git diff --cached):
 *   1. _archived/** append-only — nunca modificar/deletar arquivos existentes
 *   2. invalidation-log.jsonl append-only — apenas adicionar linhas, nunca editar/remover
 *   3. Pacotes em available/locked não podem ser deletados sem entry no invalidation-log
 *   4. Mutação em package.json requer bump de lifecycle.* (ao menos 1 campo alterado)
 *
 * Uso:
 *   npx tsx scripts/validate-stockpile-mutations.ts          # lê git diff --cached
 *   npx tsx scripts/validate-stockpile-mutations.ts --dir p  # diretório customizado
 *
 * Exit code: 0 = válido, 1 = violações encontradas.
 *
 * F1.6 — Codex HIGH #6 + Codex M4
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REPO_ROOT = path.resolve(__dirname, '..')
const DEFAULT_STOCKPILE_RELDIR = '.claude/blog/data/stockpile'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MutationErrorCode =
  | 'ARCHIVED_MODIFIED'
  | 'ARCHIVED_DELETED'
  | 'LOG_LINE_REMOVED'
  | 'LOG_LINE_MODIFIED'
  | 'PKG_DELETED_WITHOUT_LOG'
  | 'PKG_JSON_NO_LIFECYCLE_BUMP'

export interface MutationError {
  code: MutationErrorCode
  file: string
  message: string
}

export interface StagedFile {
  /** Path relative to repo root, using forward slashes */
  path: string
  /** A=added, M=modified, D=deleted, R=renamed */
  status: 'A' | 'M' | 'D' | 'R'
  /** HEAD content (null for new files or if git error) */
  oldContent: string | null
  /** Staged content (null for deleted files or if git error) */
  newContent: string | null
}

export interface ValidationResult {
  errors: MutationError[]
  valid: boolean
}

// ---------------------------------------------------------------------------
// Core validation logic (pure — no git calls, testable)
// ---------------------------------------------------------------------------

function isArchived(filePath: string, stockpileRelDir: string): boolean {
  const archivedPrefix = `${stockpileRelDir}/_archived/`
  return filePath.startsWith(archivedPrefix)
}

function isInvalidationLog(filePath: string, stockpileRelDir: string): boolean {
  return filePath === `${stockpileRelDir}/invalidation-log.jsonl`
}

function isPackageJson(filePath: string, stockpileRelDir: string): boolean {
  const packagesPrefix = `${stockpileRelDir}/packages/`
  return filePath.startsWith(packagesPrefix) && filePath.endsWith('/package.json')
}

function extractEquivalenceId(packageJsonPath: string, stockpileRelDir: string): string | null {
  const packagesPrefix = `${stockpileRelDir}/packages/`
  const relativePath = packageJsonPath.slice(packagesPrefix.length)
  const parts = relativePath.split('/')
  return parts[0] ?? null
}

function parseJsonSafe(content: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(content)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function getLifecycleFingerprint(pkg: Record<string, unknown>): string {
  const lifecycle = pkg['lifecycle']
  return JSON.stringify(lifecycle ?? null)
}

function getPromotionState(pkg: Record<string, unknown>): string | null {
  const state = pkg['promotion_state']
  return typeof state === 'string' ? state : null
}

function validateArchivedMutation(file: StagedFile): MutationError | null {
  if (file.status === 'M') {
    return {
      code: 'ARCHIVED_MODIFIED',
      file: file.path,
      message: `_archived/ é append-only: arquivo existente não pode ser modificado (${file.path})`,
    }
  }
  if (file.status === 'D') {
    return {
      code: 'ARCHIVED_DELETED',
      file: file.path,
      message: `_archived/ é append-only: arquivo existente não pode ser deletado (${file.path})`,
    }
  }
  return null
}

function validateLogAppendOnly(file: StagedFile): MutationError[] {
  const errors: MutationError[] = []

  if (file.status === 'A' || file.oldContent === null) {
    // Novo arquivo — qualquer conteúdo é permitido
    return errors
  }

  const oldLines = file.oldContent.split('\n').filter(l => l.trim() !== '')
  const newLines = (file.newContent ?? '').split('\n').filter(l => l.trim() !== '')

  // Cada linha antiga deve aparecer na mesma posição (ou antes) nas novas linhas
  // A linha não pode ser modificada nem removida
  for (let i = 0; i < oldLines.length; i++) {
    if (i >= newLines.length) {
      errors.push({
        code: 'LOG_LINE_REMOVED',
        file: file.path,
        message: `invalidation-log.jsonl é append-only: linha ${i + 1} foi removida`,
      })
    } else if (oldLines[i] !== newLines[i]) {
      errors.push({
        code: 'LOG_LINE_MODIFIED',
        file: file.path,
        message: `invalidation-log.jsonl é append-only: linha ${i + 1} foi modificada`,
      })
    }
  }

  return errors
}

function validatePackageDelete(
  file: StagedFile,
  stockpileRelDir: string,
  logNewContent: string | null,
): MutationError | null {
  if (file.oldContent === null) return null

  const pkg = parseJsonSafe(file.oldContent)
  if (pkg === null) return null

  const state = getPromotionState(pkg)
  if (state !== 'available' && state !== 'locked') return null

  const eqId = extractEquivalenceId(file.path, stockpileRelDir)
  if (eqId === null) return null

  // O log staged deve conter um evento 'deleted' ou 'invalidated' para este equivalence_id
  if (logNewContent === null) {
    return {
      code: 'PKG_DELETED_WITHOUT_LOG',
      file: file.path,
      message: `Pacote ${eqId} (state=${state}) deletado sem entry no invalidation-log.jsonl`,
    }
  }

  const logLines = logNewContent.split('\n').filter(l => l.trim() !== '')
  const hasDeletionEntry = logLines.some(line => {
    try {
      const event = JSON.parse(line) as Record<string, unknown>
      return (
        event['equivalence_id'] === eqId &&
        (event['event_type'] === 'deleted' || event['event_type'] === 'invalidated')
      )
    } catch {
      return false
    }
  })

  if (!hasDeletionEntry) {
    return {
      code: 'PKG_DELETED_WITHOUT_LOG',
      file: file.path,
      message: `Pacote ${eqId} (state=${state}) deletado sem entry no invalidation-log.jsonl`,
    }
  }

  return null
}

function validatePackageJsonMutation(file: StagedFile): MutationError | null {
  if (file.oldContent === null || file.newContent === null) return null

  const oldPkg = parseJsonSafe(file.oldContent)
  const newPkg = parseJsonSafe(file.newContent)

  if (oldPkg === null || newPkg === null) return null

  // Se o conteúdo mudou, deve haver mudança no lifecycle
  if (file.oldContent === file.newContent) return null

  const oldLifecycle = getLifecycleFingerprint(oldPkg)
  const newLifecycle = getLifecycleFingerprint(newPkg)

  if (oldLifecycle === newLifecycle) {
    return {
      code: 'PKG_JSON_NO_LIFECYCLE_BUMP',
      file: file.path,
      message: `package.json modificado sem bump em lifecycle.* (mutação silenciosa não permitida)`,
    }
  }

  return null
}

export function validateMutations(
  stagedFiles: StagedFile[],
  stockpileRelDir: string = DEFAULT_STOCKPILE_RELDIR,
): ValidationResult {
  const errors: MutationError[] = []

  // Pré-computar conteúdo staged do invalidation-log (pode ser usado em múltiplas validações)
  const logFile = stagedFiles.find(f => isInvalidationLog(f.path, stockpileRelDir))
  const logNewContent = logFile?.newContent ?? null

  for (const file of stagedFiles) {
    // Ignorar arquivos fora do diretório do stockpile
    if (!file.path.startsWith(stockpileRelDir + '/')) continue

    if (isArchived(file.path, stockpileRelDir)) {
      const err = validateArchivedMutation(file)
      if (err) errors.push(err)
      continue
    }

    if (isInvalidationLog(file.path, stockpileRelDir)) {
      errors.push(...validateLogAppendOnly(file))
      continue
    }

    if (isPackageJson(file.path, stockpileRelDir)) {
      if (file.status === 'D') {
        const err = validatePackageDelete(file, stockpileRelDir, logNewContent)
        if (err) errors.push(err)
      } else if (file.status === 'M') {
        const err = validatePackageJsonMutation(file)
        if (err) errors.push(err)
      }
      continue
    }
  }

  return { errors, valid: errors.length === 0 }
}

// ---------------------------------------------------------------------------
// Git integration
// ---------------------------------------------------------------------------

function execGit(cmd: string): string {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' })
}

function gitHeadExists(): boolean {
  try {
    execGit('git rev-parse --verify HEAD')
    return true
  } catch {
    return false
  }
}

function getHeadContent(relativePath: string): string | null {
  try {
    return execGit(`git show HEAD:${relativePath}`)
  } catch {
    // File didn't exist in HEAD (new file)
    return null
  }
}

function getStagedContent(relativePath: string): string | null {
  try {
    // :0 = staged content (index)
    return execGit(`git cat-file -p :${relativePath}`)
  } catch {
    return null
  }
}

export function buildStagedDiff(stockpileRelDir: string = DEFAULT_STOCKPILE_RELDIR): StagedFile[] {
  if (!gitHeadExists()) {
    // Primeiro commit — sem HEAD para comparar; skip checks
    return []
  }

  let nameStatus: string
  try {
    nameStatus = execGit('git diff --cached --name-status')
  } catch {
    return []
  }

  const files: StagedFile[] = []

  for (const line of nameStatus.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split('\t')
    const rawStatus = parts[0] ?? ''
    const filePath = parts[1] ?? ''

    if (!filePath) continue

    // Normalize to forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/')

    // Only process stockpile files
    if (!normalizedPath.startsWith(stockpileRelDir + '/')) continue

    let status: StagedFile['status']
    if (rawStatus.startsWith('R')) {
      status = 'R'
    } else if (rawStatus === 'A') {
      status = 'A'
    } else if (rawStatus === 'M') {
      status = 'M'
    } else if (rawStatus === 'D') {
      status = 'D'
    } else {
      continue
    }

    const oldContent = status === 'A' ? null : getHeadContent(normalizedPath)
    const newContent = status === 'D' ? null : getStagedContent(normalizedPath)

    files.push({ path: normalizedPath, status, oldContent, newContent })
  }

  return files
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] === __filename) {
  const dirArgIdx = process.argv.indexOf('--dir')
  const stockpileRelDir =
    dirArgIdx !== -1 && process.argv[dirArgIdx + 1]
      ? path.relative(REPO_ROOT, path.resolve(process.argv[dirArgIdx + 1]!)).replace(/\\/g, '/')
      : DEFAULT_STOCKPILE_RELDIR

  const staged = buildStagedDiff(stockpileRelDir)
  const result = validateMutations(staged, stockpileRelDir)

  if (result.valid) {
    console.log('✅ validate-stockpile-mutations: sem violações')
    process.exit(0)
  } else {
    console.error('❌ validate-stockpile-mutations: violações encontradas\n')
    for (const err of result.errors) {
      console.error(`  [${err.code}] ${err.message}`)
    }
    console.error(`\n${result.errors.length} violação(ões) — commit bloqueado.`)
    process.exit(1)
  }
}
