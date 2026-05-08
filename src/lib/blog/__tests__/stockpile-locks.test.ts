/**
 * src/lib/blog/__tests__/stockpile-locks.test.ts
 *
 * F4.4 — testa run lock global + per-package CAS lock.
 *
 * Critério de aceite:
 *   - 2 runs concorrentes, ambos tentam mesmo pacote → exatamente 1 wins
 *   - Lock expirado por TTL é roubável
 *   - Crash da run não trava sistema indefinidamente
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  acquireRunLock,
  releaseRunLock,
  getRunLock,
  acquirePackageLock,
  releasePackageLock,
  getPackageLock,
} from '../stockpile-locks'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'locks-test-'))
  fs.mkdirSync(path.join(tmpDir, 'packages'), { recursive: true })
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makePackageDir(uuid: string, content = '{"test":true}'): void {
  const pkgDir = path.join(tmpDir, 'packages', uuid)
  fs.mkdirSync(pkgDir, { recursive: true })
  fs.writeFileSync(path.join(pkgDir, 'package.json'), content)
}

// ---------------------------------------------------------------------------
// Run lock — basic acquire/release
// ---------------------------------------------------------------------------

describe('acquireRunLock', () => {
  it('acquires lock when none exists', () => {
    const result = acquireRunLock(tmpDir, 'run-1')
    expect(result.acquired).toBe(true)
    expect(fs.existsSync(result.lock_path)).toBe(true)
  })

  it('blocks second run while first holds lock', () => {
    acquireRunLock(tmpDir, 'run-1')
    const result = acquireRunLock(tmpDir, 'run-2')
    expect(result.acquired).toBe(false)
    expect(result.existing_lock?.run_id).toBe('run-1')
  })

  it('releases lock so next run can acquire', () => {
    acquireRunLock(tmpDir, 'run-1')
    releaseRunLock(tmpDir, 'run-1')
    const result = acquireRunLock(tmpDir, 'run-2')
    expect(result.acquired).toBe(true)
  })

  it('same run re-acquiring refreshes lock', () => {
    acquireRunLock(tmpDir, 'run-1')
    const result = acquireRunLock(tmpDir, 'run-1')
    expect(result.acquired).toBe(true)
  })

  it('stale lock (past TTL) is self-healed and new run can acquire', () => {
    // Write a stale lock manually
    const staleLock = {
      run_id: 'run-crashed',
      acquired_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ttl_minutes: 1,
      expires_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      pid: 99999,
    }
    fs.writeFileSync(path.join(tmpDir, '.run-lock.json'), JSON.stringify(staleLock))

    const result = acquireRunLock(tmpDir, 'run-2')
    expect(result.acquired).toBe(true)
  })

  it('releaseRunLock is a no-op if run_id does not match', () => {
    acquireRunLock(tmpDir, 'run-1')
    releaseRunLock(tmpDir, 'run-2')  // different run
    const lock = getRunLock(tmpDir)
    expect(lock?.run_id).toBe('run-1')  // still locked
  })

  it('getRunLock returns null when no lock', () => {
    expect(getRunLock(tmpDir)).toBeNull()
  })

  it('getRunLock returns null for stale lock', () => {
    const staleLock = {
      run_id: 'run-1',
      acquired_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ttl_minutes: 1,
      expires_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      pid: 1,
    }
    fs.writeFileSync(path.join(tmpDir, '.run-lock.json'), JSON.stringify(staleLock))
    expect(getRunLock(tmpDir)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Per-package CAS lock — basic
// ---------------------------------------------------------------------------

describe('acquirePackageLock', () => {
  it('acquires package lock when none exists', () => {
    const uuid = randomUUID()
    makePackageDir(uuid)

    const result = acquirePackageLock(tmpDir, uuid, 'run-1')
    expect(result.acquired).toBe(true)
    expect(result.sha).toHaveLength(64)
  })

  it('returns not acquired when package.json does not exist', () => {
    const uuid = randomUUID()
    const result = acquirePackageLock(tmpDir, uuid, 'run-1')
    expect(result.acquired).toBe(false)
    expect(result.conflict_reason).toContain('package.json nao encontrado')
  })

  it('blocks second run on same package', () => {
    const uuid = randomUUID()
    makePackageDir(uuid)

    acquirePackageLock(tmpDir, uuid, 'run-1')
    const result2 = acquirePackageLock(tmpDir, uuid, 'run-2')
    expect(result2.acquired).toBe(false)
    expect(result2.conflict_reason).toContain('run-1')
  })

  it('releases package lock so next run can acquire', () => {
    const uuid = randomUUID()
    makePackageDir(uuid)

    const r1 = acquirePackageLock(tmpDir, uuid, 'run-1')
    releasePackageLock(tmpDir, uuid, 'run-1', r1.sha)
    const r2 = acquirePackageLock(tmpDir, uuid, 'run-2')
    expect(r2.acquired).toBe(true)
  })

  it('stale package lock is self-healed', () => {
    const uuid = randomUUID()
    makePackageDir(uuid)

    // Write stale lock
    const staleLock = {
      run_id: 'run-crashed',
      equivalence_id: uuid,
      acquired_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ttl_minutes: 1,
      expires_at: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
      package_sha: 'a'.repeat(64),
    }
    fs.writeFileSync(path.join(tmpDir, 'packages', uuid, '.lock.json'), JSON.stringify(staleLock))

    const result = acquirePackageLock(tmpDir, uuid, 'run-new')
    expect(result.acquired).toBe(true)
  })

  it('releasePackageLock is a no-op if sha does not match', () => {
    const uuid = randomUUID()
    makePackageDir(uuid)

    const r1 = acquirePackageLock(tmpDir, uuid, 'run-1')
    releasePackageLock(tmpDir, uuid, 'run-1', 'wrong-sha')
    const lock = getPackageLock(tmpDir, uuid)
    expect(lock?.run_id).toBe('run-1')  // still locked
    releasePackageLock(tmpDir, uuid, 'run-1', r1.sha)  // cleanup
  })
})

// ---------------------------------------------------------------------------
// F4.4 acceptance: 2 concurrent runs → exactly 1 wins per package
// ---------------------------------------------------------------------------

describe('CAS concurrent contention', () => {
  it('two concurrent lock attempts on same package — exactly 1 wins', async () => {
    const uuid = randomUUID()
    makePackageDir(uuid, '{"concurrent":true}')

    // Simulate 2 concurrent attempts in parallel
    const [r1, r2] = await Promise.all([
      new Promise<ReturnType<typeof acquirePackageLock>>(resolve =>
        resolve(acquirePackageLock(tmpDir, uuid, 'run-A')),
      ),
      new Promise<ReturnType<typeof acquirePackageLock>>(resolve =>
        resolve(acquirePackageLock(tmpDir, uuid, 'run-B')),
      ),
    ])

    const winners = [r1, r2].filter(r => r.acquired)
    const losers = [r1, r2].filter(r => !r.acquired)
    expect(winners).toHaveLength(1)
    expect(losers).toHaveLength(1)
  })

  it('multiple packages can be locked simultaneously by different runs', () => {
    const uuid1 = randomUUID()
    const uuid2 = randomUUID()
    makePackageDir(uuid1)
    makePackageDir(uuid2)

    const r1 = acquirePackageLock(tmpDir, uuid1, 'run-X')
    const r2 = acquirePackageLock(tmpDir, uuid2, 'run-Y')
    expect(r1.acquired).toBe(true)
    expect(r2.acquired).toBe(true)
  })
})
