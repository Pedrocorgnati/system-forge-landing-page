/**
 * src/lib/blog/invalidation-log.ts
 *
 * Helper para leitura e escrita de `invalidation-log.jsonl`.
 * O log é append-only — nunca remover nem editar linhas existentes.
 *
 * Concorrência: file-lock via O_CREAT|O_EXCL para evitar race conditions
 * entre múltiplas escritas simultâneas (rotina cloud + operação local).
 *
 * F3.1 — critério de aceite: append concorrente de 100 eventos → 100 linhas válidas.
 */

import fs from 'fs'
import path from 'path'
import { InvalidationEventSchema, type InvalidationEvent } from './stockpile-schema'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_LOCK_RETRY_MS = 50
const DEFAULT_LOCK_MAX_RETRIES = 40  // max 2s total wait
const LOCK_STALE_AFTER_MS = 10_000  // 10s — lock is stale if older than this

// ---------------------------------------------------------------------------
// File-lock helpers
// ---------------------------------------------------------------------------

/** Adquire lock via O_CREAT|O_EXCL (atômico no filesystem). Retorna fd. */
function acquireLock(lockPath: string, retries = DEFAULT_LOCK_MAX_RETRIES): number {
  for (let i = 0; i < retries; i++) {
    try {
      const fd = fs.openSync(lockPath, 'wx')
      return fd
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err

      // Lockfile exists — check if stale
      try {
        const stat = fs.statSync(lockPath)
        const ageSinceCreated = Date.now() - stat.ctimeMs
        if (ageSinceCreated > LOCK_STALE_AFTER_MS) {
          fs.unlinkSync(lockPath)
          continue  // retry immediately
        }
      } catch {
        // stat failed (lock was removed between check and stat) — retry
      }

      // Wait before retry
      if (i < retries - 1) {
        const waitMs = DEFAULT_LOCK_RETRY_MS * (1 + Math.random())
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs)
      }
    }
  }
  throw new Error(`Failed to acquire lock at ${lockPath} after ${retries} retries`)
}

function releaseLock(lockPath: string, fd: number): void {
  try {
    fs.closeSync(fd)
  } catch {
    // ignore close error
  }
  try {
    fs.unlinkSync(lockPath)
  } catch {
    // ignore unlink error (already gone)
  }
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

/**
 * Resolve o path do log a partir do diretório do stockpile.
 * Se stockpileDir não for fornecido, usa a localização padrão relativa ao repo.
 */
export function resolveLogPath(stockpileDir?: string): string {
  if (stockpileDir) {
    return path.join(stockpileDir, 'invalidation-log.jsonl')
  }
  // Default: relativo ao package root (src/lib/blog/ → ../../..)
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..')
  return path.join(repoRoot, '.claude', 'blog', 'data', 'stockpile', 'invalidation-log.jsonl')
}

/**
 * Appenda um evento ao invalidation-log.jsonl de forma atômica.
 * Valida o evento contra o schema antes de escrever.
 *
 * Usa file-lock para garantir serialização mesmo com escritas concorrentes.
 */
export function appendInvalidationEvent(
  event: InvalidationEvent,
  stockpileDir?: string,
): void {
  const parsed = InvalidationEventSchema.safeParse(event)
  if (!parsed.success) {
    throw new Error(`Evento inválido: ${JSON.stringify(parsed.error.issues)}`)
  }

  const logPath = resolveLogPath(stockpileDir)
  const lockPath = logPath + '.lock'

  // Garantir que o diretório existe
  fs.mkdirSync(path.dirname(logPath), { recursive: true })

  const line = JSON.stringify(parsed.data) + '\n'
  const fd = acquireLock(lockPath)
  try {
    fs.appendFileSync(logPath, line, { encoding: 'utf8', flag: 'a' })
  } finally {
    releaseLock(lockPath, fd)
  }
}

/**
 * Lê todos os eventos do invalidation-log.jsonl.
 * Linhas inválidas são ignoradas silenciosamente (retorna apenas as válidas).
 * Retorna array vazio se o arquivo não existe.
 */
export function readInvalidationLog(stockpileDir?: string): InvalidationEvent[] {
  const logPath = resolveLogPath(stockpileDir)
  if (!fs.existsSync(logPath)) return []

  const raw = fs.readFileSync(logPath, 'utf8')
  const events: InvalidationEvent[] = []

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const parsed: unknown = JSON.parse(trimmed)
      const result = InvalidationEventSchema.safeParse(parsed)
      if (result.success) {
        events.push(result.data)
      }
    } catch {
      // linha inválida — ignorar
    }
  }

  return events
}

/**
 * Retorna todos os eventos do log para um equivalence_id específico.
 * Retorna array vazio se não houver eventos.
 */
export function getEventsForEquivalenceId(
  equivalenceId: string,
  stockpileDir?: string,
): InvalidationEvent[] {
  return readInvalidationLog(stockpileDir).filter(e => e.equivalence_id === equivalenceId)
}
