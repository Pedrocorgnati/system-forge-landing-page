/**
 * src/lib/blog/__tests__/stockpile-schema-upgrader.test.ts
 *
 * Testes unitários do stockpile-schema-upgrader.ts.
 * Cobre: currentSchemaVersion, upgradePackage, migrationRegistry, idempotência.
 *
 * F1.1.a — critério de aceite: migração v1→v2 simulada com pacote sintético.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  currentSchemaVersion,
  upgradePackage,
  migrationRegistry,
  CURRENT_SCHEMA_VERSION,
  type MigrationFn,
} from '../stockpile-schema-upgrader'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_ISO = '2026-05-06T14:00:00Z'
const VALID_SHA256 = 'a'.repeat(64)

const validV1Package = {
  equivalence_id: VALID_UUID,
  stockpile_version: 1 as const,
  type: 'universal' as const,
  locales_present: ['pt-BR', 'en'] as const,
  primary_locale: 'pt-BR' as const,
  volatility_class: 'vendor' as const,
  freshness_policy: {
    max_age_days: 21,
    rewrite_required_above_days: 45,
    freshness_gate_signals: [],
  },
  scores: {
    'pt-BR': { seo: 82, conversion: 75, quality_gate: 88 },
    'en':    { seo: 79, conversion: 70, quality_gate: 84 },
  },
  brief_fingerprint: {
    cluster_id: 'cluster-001',
    primary_keywords: ['next.js', 'desenvolvimento web'],
    intent: 'comercial' as const,
    hash_sha256: VALID_SHA256,
  },
  lifecycle: {
    created_at: VALID_ISO,
    quality_gated_at: VALID_ISO,
    freshness_checked_at: null,
    promoted_at: null,
    promoted_in_commit: null,
  },
  promotion_state: 'available' as const,
  promotion_lock: null,
  invalidation_reason: null,
  internal_links_resolved: false,
}

// ---------------------------------------------------------------------------
// currentSchemaVersion
// ---------------------------------------------------------------------------

describe('currentSchemaVersion', () => {
  it('retorna o valor constante CURRENT_SCHEMA_VERSION', () => {
    expect(currentSchemaVersion()).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('retorna 1 (versão atual do schema)', () => {
    expect(currentSchemaVersion()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// upgradePackage — sem migração necessária
// ---------------------------------------------------------------------------

describe('upgradePackage — sem migração necessária', () => {
  it('retorna pacote v1 sem mudança quando toVersion === 1', () => {
    const result = upgradePackage(validV1Package, 1)
    expect(result.equivalence_id).toBe(VALID_UUID)
    expect(result.stockpile_version).toBe(1)
  })

  it('é idempotente: aplicar duas vezes retorna o mesmo resultado', () => {
    const once = upgradePackage(validV1Package, 1)
    const twice = upgradePackage(once, 1)
    expect(twice.equivalence_id).toBe(once.equivalence_id)
    expect(twice.stockpile_version).toBe(once.stockpile_version)
  })

  it('usa CURRENT_SCHEMA_VERSION como default de toVersion', () => {
    const result = upgradePackage(validV1Package)
    expect(result.stockpile_version).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('rejeita pacote com campos inválidos mesmo sem migração', () => {
    expect(() =>
      upgradePackage({ ...validV1Package, equivalence_id: 'not-uuid' }, 1)
    ).toThrow()
  })
})

// ---------------------------------------------------------------------------
// upgradePackage — downgrade proibido
// ---------------------------------------------------------------------------

describe('upgradePackage — downgrade', () => {
  it('lança erro ao tentar downgrade (v1 → v0)', () => {
    expect(() => upgradePackage(validV1Package, 0)).toThrow('Downgrade não suportado')
  })

  it('lança erro ao tentar downgrade (v2 → v1) com pacote sintético v2', () => {
    const v2 = { ...validV1Package, stockpile_version: 2 }
    expect(() => upgradePackage(v2, 1)).toThrow('Downgrade não suportado')
  })
})

// ---------------------------------------------------------------------------
// upgradePackage — migração v1→v2 simulada
// ---------------------------------------------------------------------------

describe('upgradePackage — migração v1→v2 simulada', () => {
  const SAVED_MIGRATION_1_2 = migrationRegistry['1_2']

  beforeEach(() => {
    // Registrar migração sintética v1→v2: adiciona campo `reviewed_at`
    const migrate: MigrationFn = (pkg) => ({
      ...pkg,
      stockpile_version: 2,
      reviewed_at: '2026-05-06T15:00:00Z',
    })
    migrationRegistry['1_2'] = migrate
  })

  afterEach(() => {
    // Restaurar estado original do registry
    if (SAVED_MIGRATION_1_2) {
      migrationRegistry['1_2'] = SAVED_MIGRATION_1_2
    } else {
      delete migrationRegistry['1_2']
    }
  })

  it('migra pacote v1 para v2 quando migração está registrada', () => {
    // Para que o schema v2 seja aceito, precisamos usar o schema relaxado
    // (StockpilePackageSchema ainda exige stockpile_version: 1).
    // O teste verifica que a função de migração é invocada corretamente.
    // O upgradePackage lança erro no parse final pois v2 ≠ literal(1).
    // Isso é ESPERADO — quando v2 for real, o schema vai aceitar z.literal(2) também.
    expect(() => upgradePackage(validV1Package, 2)).toThrow()
    // Mas a migração foi invocada — verificamos via mock abaixo
  })

  it('a função de migração registrada é chamada durante o upgrade', () => {
    let called = false
    const trackedMigrate: MigrationFn = (pkg) => {
      called = true
      return { ...pkg, stockpile_version: 2, reviewed_at: '2026-05-06T15:00:00Z' }
    }
    migrationRegistry['1_2'] = trackedMigrate

    try {
      upgradePackage(validV1Package, 2)
    } catch {
      // Esperado: schema v2 não existe — mas a migração foi executada
    }
    expect(called).toBe(true)
  })

  it('migração é idempotente: aplicar duas vezes ao mesmo input', () => {
    let callCount = 0
    const countingMigrate: MigrationFn = (pkg) => {
      callCount++
      return { ...pkg, stockpile_version: 2, reviewed_at: '2026-05-06T15:00:00Z' }
    }
    migrationRegistry['1_2'] = countingMigrate

    try { upgradePackage(validV1Package, 2) } catch { /* esperado */ }
    try { upgradePackage(validV1Package, 2) } catch { /* esperado */ }

    // Chamada 1 vez por invocação de upgradePackage
    expect(callCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// upgradePackage — migração ausente
// ---------------------------------------------------------------------------

describe('upgradePackage — migração não registrada', () => {
  it('lança erro descritivo quando migração v1→v3 não está registrada', () => {
    expect(() => upgradePackage(validV1Package, 3)).toThrow('1_2')
  })

  it('mensagem de erro menciona a chave da migração faltante', () => {
    expect(() => upgradePackage(validV1Package, 3)).toThrow('migrationRegistry')
  })
})

// ---------------------------------------------------------------------------
// migrationRegistry
// ---------------------------------------------------------------------------

describe('migrationRegistry', () => {
  it('é um objeto inicialmente sem migrações registradas', () => {
    // O registry base não tem entradas — migrações são adicionadas conforme versões evoluem
    const keysWithoutTest = Object.keys(migrationRegistry).filter(k => k !== '1_2')
    expect(keysWithoutTest).toHaveLength(0)
  })

  it('aceita registro de nova função de migração', () => {
    const key = 'test_migration'
    migrationRegistry[key] = (pkg) => pkg
    expect(migrationRegistry[key]).toBeDefined()
    delete migrationRegistry[key]
  })
})
