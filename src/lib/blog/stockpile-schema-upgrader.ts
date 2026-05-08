/**
 * src/lib/blog/stockpile-schema-upgrader.ts
 *
 * Schema versioning e auto-migrate para pacotes Stockpile V2.
 *
 * Política:
 *   - Toda mudança estrutural bumpa `stockpile_version`.
 *   - Pacotes com versão antiga são auto-migrados in-memory na leitura.
 *   - Persiste na próxima escrita (lazy persist — DEC-12).
 *   - Migrações idempotentes: aplicar N vezes = mesmo resultado que 1 vez.
 *
 * F1.1.a — schema versioning + upgrader (Codex HIGH #6)
 */

import { z } from 'zod'
import { StockpilePackageSchema, type StockpilePackage } from './stockpile-schema'

// ---------------------------------------------------------------------------
// Version constants
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = 1

/** Retorna a versão canônica atual do schema de pacotes. */
export function currentSchemaVersion(): number {
  return CURRENT_SCHEMA_VERSION
}

// ---------------------------------------------------------------------------
// Migration types
// ---------------------------------------------------------------------------

/** Input de uma migração: versão antiga do pacote (shape parcialmente desconhecido). */
export type RawPackageV1 = z.infer<typeof StockpilePackageSchema>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MigrationFn = (pkg: Record<string, any>) => Record<string, any>

/**
 * Registry de migrações.
 * Chave: "fromVersion_toVersion" (ex: "1_2", "2_3").
 * Valor: função de migração idempotente.
 *
 * Quando um novo campo é adicionado:
 *   1. Incrementar CURRENT_SCHEMA_VERSION.
 *   2. Adicionar entrada "N_(N+1)" com função de backfill.
 *   3. Atualizar StockpilePackageSchema para aceitar nova versão.
 */
export const migrationRegistry: Record<string, MigrationFn> = {
  // Placeholder para demonstrar a interface. Ativado quando v2 for criada.
  // '1_2': (pkg) => ({ ...pkg, stockpile_version: 2, new_field: 'default_value' }),
}

// ---------------------------------------------------------------------------
// upgradePackage
// ---------------------------------------------------------------------------

/**
 * Auto-migra um pacote de sua versão atual até `toVersion`.
 * Default: migra até `currentSchemaVersion()`.
 *
 * Idempotente: se `pkg.stockpile_version === toVersion`, retorna o mesmo objeto.
 *
 * @throws {Error} se a migração necessária não está registrada.
 */
export function upgradePackage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pkg: Record<string, any>,
  toVersion: number = CURRENT_SCHEMA_VERSION,
): StockpilePackage {
  let current = { ...pkg } as Record<string, unknown>
  const fromVersion = (current.stockpile_version as number) ?? 1

  if (fromVersion === toVersion) {
    return StockpilePackageSchema.parse(current)
  }

  if (fromVersion > toVersion) {
    throw new Error(
      `[stockpile-upgrader] Downgrade não suportado: v${fromVersion} → v${toVersion}`,
    )
  }

  for (let v = fromVersion; v < toVersion; v++) {
    const key = `${v}_${v + 1}`
    const migrate = migrationRegistry[key]
    if (!migrate) {
      throw new Error(
        `[stockpile-upgrader] Migração "${key}" não registrada. Registrar em migrationRegistry.`,
      )
    }
    current = migrate(current) as Record<string, unknown>
  }

  return StockpilePackageSchema.parse(current)
}

// ---------------------------------------------------------------------------
// readAndUpgradePackage — helper para leitura de package.json em disco
// ---------------------------------------------------------------------------

/**
 * Lê um `package.json` de stockpile a partir de um path absoluto,
 * valida o schema e auto-migra se necessário.
 *
 * Node-only (usa `fs.readFileSync`). Não importar em runtime Next.js.
 */
export function readAndUpgradePackage(packageJsonPath: string): StockpilePackage {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')

  let raw: unknown
  try {
    raw = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  } catch (err) {
    throw new Error(`[stockpile-upgrader] Falha ao ler ${packageJsonPath}: ${String(err)}`)
  }

  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`[stockpile-upgrader] Conteúdo inválido em ${packageJsonPath}`)
  }

  return upgradePackage(raw as Record<string, unknown>)
}
