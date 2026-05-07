/**
 * src/lib/blog/stockpile-locks.ts
 *
 * F4.4 — Run-lock global + per-package CAS lock para promoção atômica.
 *
 * Run lock: `.run-lock.json` na raiz do stockpile.
 *   - 1 run por vez; TTL configurável; self-heal de lock expirado.
 *
 * Per-package CAS lock: `packages/{uuid}/.lock.json`
 *   - Baseado no SHA256 do package.json no momento da leitura.
 *   - Conflito = outro processo modificou o pacote → abandonar e tentar próximo.
 *
 * Ambos usam O_CREAT|O_EXCL (mesmo mecanismo do invalidation-log.ts) para atomicidade.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_RUN_LOCK_TTL_MINUTES = 30
const DEFAULT_PKG_LOCK_TTL_MINUTES = 10
const RUN_LOCK_FILE = '.run-lock.json'
const PKG_LOCK_FILE = '.lock.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RunLockInfo {
  run_id: string
  acquired_at: string
  ttl_minutes: number
  expires_at: string
  pid: number
}

export interface PackageLockInfo {
  run_id: string
  equivalence_id: string
  acquired_at: string
  ttl_minutes: number
  expires_at: string
  package_sha: string  // SHA256 of package.json at lock time (CAS check)
}

export interface AcquireRunLockResult {
  acquired: boolean
  lock_path: string
  existing_lock?: RunLockInfo
}

export interface AcquirePackageLockResult {
  acquired: boolean
  sha: string
  conflict_reason?: string
}

// ---------------------------------------------------------------------------
// SHA helper
// ---------------------------------------------------------------------------

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function addMinutes(isoStr: string, minutes: number): string {
  return new Date(new Date(isoStr).getTime() + minutes * 60_000)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
}

function isExpired(expiresAt: string): boolean {
  return Date.now() > new Date(expiresAt).getTime()
}

// ---------------------------------------------------------------------------
// Run lock
// ---------------------------------------------------------------------------

/**
 * Acquires the global run lock.
 * If a stale lock exists (past TTL), it is overwritten (self-heal).
 * Returns { acquired: false } if another run is active.
 */
export function acquireRunLock(
  stockpileDir: string,
  runId: string,
  ttlMinutes: number = DEFAULT_RUN_LOCK_TTL_MINUTES,
): AcquireRunLockResult {
  const lockPath = path.join(stockpileDir, RUN_LOCK_FILE)

  // Check for existing lock
  if (fs.existsSync(lockPath)) {
    let existing: RunLockInfo
    try {
      existing = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as RunLockInfo
    } catch {
      // Corrupt lock — remove and proceed
      fs.unlinkSync(lockPath)
      return acquireRunLock(stockpileDir, runId, ttlMinutes)
    }

    if (!isExpired(existing.expires_at)) {
      // Active lock from another run
      if (existing.run_id === runId) {
        // Same run re-acquiring — refresh TTL; remove first so 'wx' succeeds
        try { fs.unlinkSync(lockPath) } catch { /* ignore */ }
        return writeRunLock(lockPath, runId, ttlMinutes)
      }
      return { acquired: false, lock_path: lockPath, existing_lock: existing }
    }

    // Stale lock — self-heal by removing
    try {
      fs.unlinkSync(lockPath)
    } catch {
      // Already removed by concurrent cleanup — continue
    }
  }

  return writeRunLock(lockPath, runId, ttlMinutes)
}

function writeRunLock(lockPath: string, runId: string, ttlMinutes: number): AcquireRunLockResult {
  const acquiredAt = nowIso()
  const lock: RunLockInfo = {
    run_id: runId,
    acquired_at: acquiredAt,
    ttl_minutes: ttlMinutes,
    expires_at: addMinutes(acquiredAt, ttlMinutes),
    pid: process.pid,
  }

  try {
    // O_CREAT|O_EXCL for atomicity
    const fd = fs.openSync(lockPath, 'wx')
    fs.writeSync(fd, JSON.stringify(lock, null, 2))
    fs.closeSync(fd)
    return { acquired: true, lock_path: lockPath }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      // Race condition — another process beat us
      return { acquired: false, lock_path: lockPath }
    }
    throw err
  }
}

/**
 * Releases the global run lock.
 * Only removes if the lock belongs to runId (safety check).
 */
export function releaseRunLock(stockpileDir: string, runId: string): void {
  const lockPath = path.join(stockpileDir, RUN_LOCK_FILE)
  if (!fs.existsSync(lockPath)) return

  try {
    const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as RunLockInfo
    if (existing.run_id !== runId) return  // not our lock
  } catch {
    // Can't read — attempt removal anyway
  }

  try {
    fs.unlinkSync(lockPath)
  } catch {
    // Already removed
  }
}

/**
 * Returns the current run lock info, or null if no active lock.
 */
export function getRunLock(stockpileDir: string): RunLockInfo | null {
  const lockPath = path.join(stockpileDir, RUN_LOCK_FILE)
  if (!fs.existsSync(lockPath)) return null

  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as RunLockInfo
    if (isExpired(lock.expires_at)) return null
    return lock
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Per-package CAS lock
// ---------------------------------------------------------------------------

/**
 * Acquires a per-package lock using CAS on the package.json SHA.
 *
 * Reads the current package.json content and computes its SHA.
 * If the lock file doesn't exist and no conflicting write has occurred, acquires the lock.
 *
 * Returns { acquired: false } if:
 *   - Another run holds an active lock on this package
 *   - The package.json doesn't exist
 */
export function acquirePackageLock(
  stockpileDir: string,
  equivalenceId: string,
  runId: string,
  ttlMinutes: number = DEFAULT_PKG_LOCK_TTL_MINUTES,
): AcquirePackageLockResult {
  const pkgPath = path.join(stockpileDir, 'packages', equivalenceId, 'package.json')
  const lockPath = path.join(stockpileDir, 'packages', equivalenceId, PKG_LOCK_FILE)

  if (!fs.existsSync(pkgPath)) {
    return { acquired: false, sha: '', conflict_reason: 'package.json nao encontrado' }
  }

  // Read and hash current package.json
  let pkgContent: string
  try {
    pkgContent = fs.readFileSync(pkgPath, 'utf8')
  } catch {
    return { acquired: false, sha: '', conflict_reason: 'falha ao ler package.json' }
  }

  const currentSha = sha256(pkgContent)

  // Check for existing lock
  if (fs.existsSync(lockPath)) {
    let existingLock: PackageLockInfo
    try {
      existingLock = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as PackageLockInfo
    } catch {
      fs.unlinkSync(lockPath)
      return acquirePackageLock(stockpileDir, equivalenceId, runId, ttlMinutes)
    }

    if (!isExpired(existingLock.expires_at)) {
      if (existingLock.run_id === runId) {
        // Same run re-acquiring — check CAS
        if (existingLock.package_sha !== currentSha) {
          return { acquired: false, sha: currentSha, conflict_reason: 'CAS: package.json modificado desde a leitura inicial' }
        }
        return { acquired: true, sha: currentSha }
      }
      return {
        acquired: false,
        sha: currentSha,
        conflict_reason: `pacote bloqueado por run ${existingLock.run_id.slice(0, 8)}...`,
      }
    }

    // Stale lock — self-heal
    try { fs.unlinkSync(lockPath) } catch { /* ignore */ }
  }

  // Write the lock
  const acquiredAt = nowIso()
  const lock: PackageLockInfo = {
    run_id: runId,
    equivalence_id: equivalenceId,
    acquired_at: acquiredAt,
    ttl_minutes: ttlMinutes,
    expires_at: addMinutes(acquiredAt, ttlMinutes),
    package_sha: currentSha,
  }

  try {
    const fd = fs.openSync(lockPath, 'wx')
    fs.writeSync(fd, JSON.stringify(lock, null, 2))
    fs.closeSync(fd)
    return { acquired: true, sha: currentSha }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return { acquired: false, sha: currentSha, conflict_reason: 'race condition ao criar lock' }
    }
    throw err
  }
}

/**
 * Releases a per-package lock if it belongs to runId and SHA matches.
 */
export function releasePackageLock(
  stockpileDir: string,
  equivalenceId: string,
  runId: string,
  sha: string,
): void {
  const lockPath = path.join(stockpileDir, 'packages', equivalenceId, PKG_LOCK_FILE)
  if (!fs.existsSync(lockPath)) return

  try {
    const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as PackageLockInfo
    if (existing.run_id !== runId || existing.package_sha !== sha) return
  } catch {
    // Can't verify — don't remove
    return
  }

  try { fs.unlinkSync(lockPath) } catch { /* ignore */ }
}

/**
 * Returns the current package lock info, or null if no active lock.
 */
export function getPackageLock(stockpileDir: string, equivalenceId: string): PackageLockInfo | null {
  const lockPath = path.join(stockpileDir, 'packages', equivalenceId, PKG_LOCK_FILE)
  if (!fs.existsSync(lockPath)) return null

  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')) as PackageLockInfo
    if (isExpired(lock.expires_at)) return null
    return lock
  } catch {
    return null
  }
}
