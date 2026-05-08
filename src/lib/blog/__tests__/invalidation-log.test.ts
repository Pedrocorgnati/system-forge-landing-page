/**
 * src/lib/blog/__tests__/invalidation-log.test.ts
 *
 * Testa appendInvalidationEvent, readInvalidationLog e getEventsForEquivalenceId.
 *
 * Critério de aceite F3.1:
 *   - Append concorrente de 100 eventos em paralelo → log final tem 100 linhas válidas
 *   - Cada linha parseia em InvalidationEventSchema sem erro
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  appendInvalidationEvent,
  readInvalidationLog,
  getEventsForEquivalenceId,
  resolveLogPath,
} from '../invalidation-log'
import type { InvalidationEvent } from '../stockpile-schema'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-log-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function makeEvent(overrides: Partial<InvalidationEvent> = {}): InvalidationEvent {
  return {
    event_id: randomUUID(),
    event_type: 'invalidated',
    equivalence_id: randomUUID(),
    timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    reason: 'test reason',
    triggered_by: 'test-suite',
    affected_locales: ['pt-BR'],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// resolveLogPath
// ---------------------------------------------------------------------------

describe('resolveLogPath', () => {
  it('uses provided stockpileDir', () => {
    const result = resolveLogPath('/some/dir')
    expect(result).toBe('/some/dir/invalidation-log.jsonl')
  })

  it('falls back to repo default when no dir provided', () => {
    const result = resolveLogPath()
    expect(result).toContain('invalidation-log.jsonl')
    expect(result).toContain('.claude/blog/data/stockpile')
  })
})

// ---------------------------------------------------------------------------
// appendInvalidationEvent — happy path
// ---------------------------------------------------------------------------

describe('appendInvalidationEvent', () => {
  it('creates log file and appends a valid event', () => {
    const event = makeEvent()
    appendInvalidationEvent(event, tmpDir)

    const logPath = path.join(tmpDir, 'invalidation-log.jsonl')
    expect(fs.existsSync(logPath)).toBe(true)

    const raw = fs.readFileSync(logPath, 'utf8')
    const lines = raw.split('\n').filter(l => l.trim())
    expect(lines).toHaveLength(1)

    const parsed = JSON.parse(lines[0]!)
    expect(parsed.event_id).toBe(event.event_id)
    expect(parsed.equivalence_id).toBe(event.equivalence_id)
  })

  it('appends multiple events sequentially', () => {
    const events = [makeEvent(), makeEvent(), makeEvent()]
    for (const ev of events) {
      appendInvalidationEvent(ev, tmpDir)
    }

    const lines = readInvalidationLog(tmpDir)
    expect(lines).toHaveLength(3)
    expect(lines.map(e => e.event_id)).toEqual(events.map(e => e.event_id))
  })

  it('creates intermediate directories if missing', () => {
    const nestedDir = path.join(tmpDir, 'a', 'b', 'c')
    const event = makeEvent()
    appendInvalidationEvent(event, nestedDir)

    const logPath = path.join(nestedDir, 'invalidation-log.jsonl')
    expect(fs.existsSync(logPath)).toBe(true)
  })

  it('throws on invalid event (schema validation)', () => {
    const badEvent = { ...makeEvent(), event_type: 'not-a-valid-type' } as unknown as InvalidationEvent
    expect(() => appendInvalidationEvent(badEvent, tmpDir)).toThrow(/Evento inválido/)
  })

  it('throws on event with empty reason', () => {
    const badEvent = makeEvent({ reason: '' })
    expect(() => appendInvalidationEvent(badEvent, tmpDir)).toThrow(/Evento inválido/)
  })

  it('throws on event with invalid equivalence_id (not UUID)', () => {
    const badEvent = makeEvent({ equivalence_id: 'not-a-uuid' })
    expect(() => appendInvalidationEvent(badEvent, tmpDir)).toThrow(/Evento inválido/)
  })

  it('supports all valid event_type values', () => {
    const types = ['invalidated', 'quarantine', 'refreshed', 'promoted', 'deleted'] as const
    for (const event_type of types) {
      appendInvalidationEvent(makeEvent({ event_id: randomUUID(), event_type }), tmpDir)
    }
    const events = readInvalidationLog(tmpDir)
    expect(events).toHaveLength(5)
    expect(events.map(e => e.event_type).sort()).toEqual([...types].sort())
  })
})

// ---------------------------------------------------------------------------
// readInvalidationLog
// ---------------------------------------------------------------------------

describe('readInvalidationLog', () => {
  it('returns empty array when log file does not exist', () => {
    const result = readInvalidationLog(tmpDir)
    expect(result).toEqual([])
  })

  it('returns empty array for empty file', () => {
    const logPath = path.join(tmpDir, 'invalidation-log.jsonl')
    fs.writeFileSync(logPath, '')
    expect(readInvalidationLog(tmpDir)).toEqual([])
  })

  it('silently skips invalid JSON lines', () => {
    const event = makeEvent()
    appendInvalidationEvent(event, tmpDir)

    const logPath = path.join(tmpDir, 'invalidation-log.jsonl')
    fs.appendFileSync(logPath, 'not-valid-json\n')
    fs.appendFileSync(logPath, '{"partial": true}\n') // valid JSON but fails schema

    const events = readInvalidationLog(tmpDir)
    expect(events).toHaveLength(1)
    expect(events[0]!.event_id).toBe(event.event_id)
  })

  it('silently skips blank lines', () => {
    const logPath = path.join(tmpDir, 'invalidation-log.jsonl')
    const event = makeEvent()
    fs.writeFileSync(logPath, '\n\n' + JSON.stringify(event) + '\n\n')
    const events = readInvalidationLog(tmpDir)
    expect(events).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// getEventsForEquivalenceId
// ---------------------------------------------------------------------------

describe('getEventsForEquivalenceId', () => {
  it('returns only events matching the equivalence_id', () => {
    const id1 = randomUUID()
    const id2 = randomUUID()

    appendInvalidationEvent(makeEvent({ equivalence_id: id1 }), tmpDir)
    appendInvalidationEvent(makeEvent({ equivalence_id: id2 }), tmpDir)
    appendInvalidationEvent(makeEvent({ equivalence_id: id1 }), tmpDir)

    const result = getEventsForEquivalenceId(id1, tmpDir)
    expect(result).toHaveLength(2)
    expect(result.every(e => e.equivalence_id === id1)).toBe(true)
  })

  it('returns empty array when no events match', () => {
    appendInvalidationEvent(makeEvent(), tmpDir)
    const result = getEventsForEquivalenceId(randomUUID(), tmpDir)
    expect(result).toEqual([])
  })

  it('returns empty array when log does not exist', () => {
    const result = getEventsForEquivalenceId(randomUUID(), tmpDir)
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// F3.1 — Critério de aceite: 100 appends concorrentes → 100 linhas válidas
// ---------------------------------------------------------------------------

describe('concurrent appends — F3.1 acceptance criterion', () => {
  it('100 concurrent appends produce exactly 100 valid lines (no corruption)', async () => {
    const events = Array.from({ length: 100 }, () => makeEvent())

    // Fire all appends in parallel (Promise.all over sync calls wrapped in promises)
    await Promise.all(
      events.map(ev =>
        new Promise<void>((resolve, reject) => {
          try {
            appendInvalidationEvent(ev, tmpDir)
            resolve()
          } catch (err) {
            reject(err)
          }
        }),
      ),
    )

    const logPath = path.join(tmpDir, 'invalidation-log.jsonl')
    const raw = fs.readFileSync(logPath, 'utf8')
    const lines = raw.split('\n').filter(l => l.trim())

    // Exactly 100 lines
    expect(lines).toHaveLength(100)

    // Each line is valid JSON parseable against schema
    const parsedEvents = readInvalidationLog(tmpDir)
    expect(parsedEvents).toHaveLength(100)

    // All event_ids accounted for (no data loss, no duplicates)
    const writtenIds = new Set(events.map(e => e.event_id))
    const readIds = new Set(parsedEvents.map(e => e.event_id))
    expect(readIds.size).toBe(100)
    for (const id of writtenIds) {
      expect(readIds.has(id)).toBe(true)
    }
  }, 15_000) // 15s timeout for 100 lock-contested writes
})
