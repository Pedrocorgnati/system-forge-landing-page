/**
 * src/lib/blog/stockpile-invalidation-check.ts
 *
 * F3.4 — verifica se um pacote tem eventos de invalidação ativos antes de promovê-lo.
 * Usado por /blog:stockpile-promote (F4.1) para filtrar candidatos inválidos.
 *
 * Lógica:
 *   - getEventsForEquivalenceId() → retorna eventos do log
 *   - Evento ativo = tipo invalidated/quarantine com menos de STALE_AFTER_DAYS dias
 *   - Pacotes com evento ativo: promotion_state = invalidated, gravar invalidation_reason
 *   - Eventos com >90 dias = ignorados (revisão manual)
 */

import fs from 'fs'
import path from 'path'
import { getEventsForEquivalenceId } from './invalidation-log'
import type { InvalidationEvent } from './stockpile-schema'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STALE_AFTER_DAYS = 90
const STALE_AFTER_MS = STALE_AFTER_DAYS * 24 * 60 * 60 * 1000

// Event types that block promotion
const BLOCKING_EVENT_TYPES: InvalidationEvent['event_type'][] = ['invalidated', 'quarantine']

// Event types that clear a block (if they appear after a blocking event)
const CLEARING_EVENT_TYPES: InvalidationEvent['event_type'][] = ['refreshed', 'promoted']

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvalidationCheckResult {
  equivalenceId: string
  blocked: boolean
  reason: string | null
  activeEvents: InvalidationEvent[]
  ignoredStaleEvents: number
}

// ---------------------------------------------------------------------------
// Core check
// ---------------------------------------------------------------------------

/**
 * Returns whether a package has active (non-stale) blocking invalidation events.
 *
 * A blocking event is cancelled if a clearing event (refreshed/promoted) appears
 * after it in the log. Stale events (>90 days) are skipped.
 */
export function checkInvalidation(
  equivalenceId: string,
  stockpileDir?: string,
): InvalidationCheckResult {
  const allEvents = getEventsForEquivalenceId(equivalenceId, stockpileDir)
  const now = Date.now()

  let ignoredStaleEvents = 0
  const recentEvents: InvalidationEvent[] = []

  for (const ev of allEvents) {
    const age = now - new Date(ev.timestamp).getTime()
    if (age > STALE_AFTER_MS) {
      ignoredStaleEvents++
      continue
    }
    recentEvents.push(ev)
  }

  // Sort by timestamp ascending (oldest first)
  recentEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Walk events in order: track net blocking state
  let blocked = false
  let blockReason: string | null = null
  const activeBlockingEvents: InvalidationEvent[] = []

  for (const ev of recentEvents) {
    if (CLEARING_EVENT_TYPES.includes(ev.event_type)) {
      blocked = false
      blockReason = null
      activeBlockingEvents.length = 0
    } else if (BLOCKING_EVENT_TYPES.includes(ev.event_type)) {
      blocked = true
      blockReason = ev.reason
      activeBlockingEvents.push(ev)
    }
  }

  return {
    equivalenceId,
    blocked,
    reason: blockReason,
    activeEvents: activeBlockingEvents,
    ignoredStaleEvents,
  }
}

// ---------------------------------------------------------------------------
// Package state updater
// ---------------------------------------------------------------------------

/**
 * If a package has active invalidation events, marks its promotion_state as
 * "invalidated" and writes the invalidation_reason to package.json.
 *
 * Returns true if the package was marked invalidated; false if it's clean.
 */
export function applyInvalidationToPackage(
  equivalenceId: string,
  stockpileDir: string,
): boolean {
  const check = checkInvalidation(equivalenceId, stockpileDir)
  if (!check.blocked) return false

  const pkgPath = path.join(stockpileDir, 'packages', equivalenceId, 'package.json')
  if (!fs.existsSync(pkgPath)) return false

  let pkg: Record<string, unknown>
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
  } catch {
    return false
  }

  pkg['promotion_state'] = 'invalidated'
  pkg['invalidation_reason'] = check.reason

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  return true
}

// ---------------------------------------------------------------------------
// Batch check for promote command
// ---------------------------------------------------------------------------

export interface BatchCheckResult {
  candidates: string[]
  blocked: InvalidationCheckResult[]
  clean: string[]
}

/**
 * Checks all provided equivalence_ids and separates them into blocked vs clean.
 * Called by /blog:stockpile-promote (F4.1) before attempting any promotion.
 */
export function batchCheckInvalidation(
  equivalenceIds: string[],
  stockpileDir?: string,
): BatchCheckResult {
  const blocked: InvalidationCheckResult[] = []
  const clean: string[] = []

  for (const eqid of equivalenceIds) {
    const result = checkInvalidation(eqid, stockpileDir)
    if (result.blocked) {
      blocked.push(result)
    } else {
      clean.push(eqid)
    }
  }

  return { candidates: equivalenceIds, blocked, clean }
}
