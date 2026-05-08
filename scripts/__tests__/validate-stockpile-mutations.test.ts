/**
 * scripts/__tests__/validate-stockpile-mutations.test.ts
 *
 * F1.6 — critério de aceite: PRs simulados com cada violação são rejeitados;
 * PR legítimo passa.
 */

import { describe, it, expect } from 'vitest'
import { validateMutations, type StagedFile } from '../validate-stockpile-mutations'

const STOCKPILE_DIR = '.claude/blog/data/stockpile'
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const VALID_ISO = '2026-05-06T14:00:00Z'

function pkgPath(uuid = VALID_UUID) {
  return `${STOCKPILE_DIR}/packages/${uuid}/package.json`
}

function archivedPath(filename: string) {
  return `${STOCKPILE_DIR}/_archived/${filename}`
}

const LOG_PATH = `${STOCKPILE_DIR}/invalidation-log.jsonl`

function makePackageJson(opts: {
  equivalence_id?: string
  promotion_state?: string
  lifecycle?: Record<string, string | null>
}): string {
  return JSON.stringify({
    equivalence_id: opts.equivalence_id ?? VALID_UUID,
    stockpile_version: 1,
    type: 'universal',
    locales_present: ['pt-BR'],
    primary_locale: 'pt-BR',
    volatility_class: 'vendor',
    freshness_policy: { max_age_days: 21, rewrite_required_above_days: 45, freshness_gate_signals: [] },
    scores: { 'pt-BR': { seo: 80, conversion: 70, quality_gate: 85 } },
    brief_fingerprint: { cluster_id: 'c1', primary_keywords: ['kw'], intent: 'comercial', hash_sha256: 'a'.repeat(64) },
    lifecycle: opts.lifecycle ?? {
      created_at: VALID_ISO,
      quality_gated_at: VALID_ISO,
      freshness_checked_at: null,
      promoted_at: null,
      promoted_in_commit: null,
    },
    promotion_state: opts.promotion_state ?? 'available',
    promotion_lock: null,
    invalidation_reason: null,
    internal_links_resolved: false,
  })
}

function makeLogLine(equivalence_id: string, event_type = 'deleted'): string {
  return JSON.stringify({
    event_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    event_type,
    equivalence_id,
    timestamp: VALID_ISO,
    reason: 'test',
    triggered_by: 'test',
    affected_locales: ['pt-BR'],
  })
}

// ---------------------------------------------------------------------------
// REGRA 1 — _archived/ append-only
// ---------------------------------------------------------------------------

describe('Rule 1 — _archived/ append-only', () => {
  it('passa quando arquivo _archived/ é novo (A)', () => {
    const staged: StagedFile[] = [
      { path: archivedPath('uuid-abc.tar.gz'), status: 'A', oldContent: null, newContent: 'content' },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('rejeita modificação de arquivo _archived/ (M)', () => {
    const staged: StagedFile[] = [
      { path: archivedPath('uuid-abc.tar.gz'), status: 'M', oldContent: 'old', newContent: 'new' },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('ARCHIVED_MODIFIED')
  })

  it('rejeita deleção de arquivo _archived/ (D)', () => {
    const staged: StagedFile[] = [
      { path: archivedPath('uuid-abc.tar.gz'), status: 'D', oldContent: 'old', newContent: null },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('ARCHIVED_DELETED')
  })
})

// ---------------------------------------------------------------------------
// REGRA 2 — invalidation-log.jsonl append-only
// ---------------------------------------------------------------------------

describe('Rule 2 — invalidation-log.jsonl append-only', () => {
  it('passa quando log é novo (A)', () => {
    const staged: StagedFile[] = [
      { path: LOG_PATH, status: 'A', oldContent: null, newContent: makeLogLine(VALID_UUID) },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('passa quando nova linha é adicionada ao final', () => {
    const oldLine = makeLogLine(VALID_UUID, 'invalidated')
    const newLine = makeLogLine('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'deleted')
    const staged: StagedFile[] = [
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: oldLine + '\n',
        newContent: oldLine + '\n' + newLine + '\n',
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('rejeita quando linha existente é removida', () => {
    const line1 = makeLogLine(VALID_UUID, 'invalidated')
    const line2 = makeLogLine('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'deleted')
    const staged: StagedFile[] = [
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: line1 + '\n' + line2 + '\n',
        newContent: line2 + '\n',  // linha1 removida
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('LOG_LINE_MODIFIED')
  })

  it('rejeita quando linha existente é editada', () => {
    const original = makeLogLine(VALID_UUID, 'invalidated')
    const modified = original.replace('invalidated', 'promoted')
    const staged: StagedFile[] = [
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: original + '\n',
        newContent: modified + '\n',
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('LOG_LINE_MODIFIED')
  })

  it('rejeita quando log anterior tem mais linhas que novo (linhas truncadas)', () => {
    const line1 = makeLogLine(VALID_UUID, 'invalidated')
    const line2 = makeLogLine('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'deleted')
    const staged: StagedFile[] = [
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: line1 + '\n' + line2 + '\n',
        newContent: line1 + '\n',  // linha2 removida
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('LOG_LINE_REMOVED')
  })
})

// ---------------------------------------------------------------------------
// REGRA 3 — Pacotes available/locked não podem ser deletados sem log entry
// ---------------------------------------------------------------------------

describe('Rule 3 — Package deletion requires log entry', () => {
  it('passa quando pacote disponível tem entry no log', () => {
    const logContent = makeLogLine(VALID_UUID, 'deleted') + '\n'
    const staged: StagedFile[] = [
      {
        path: pkgPath(),
        status: 'D',
        oldContent: makePackageJson({ promotion_state: 'available' }),
        newContent: null,
      },
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: '',
        newContent: logContent,
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('passa quando pacote está em estado invalidado (sem exigir log)', () => {
    const staged: StagedFile[] = [
      {
        path: pkgPath(),
        status: 'D',
        oldContent: makePackageJson({ promotion_state: 'invalidated' }),
        newContent: null,
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('rejeita deleção de pacote available sem log entry', () => {
    const staged: StagedFile[] = [
      {
        path: pkgPath(),
        status: 'D',
        oldContent: makePackageJson({ promotion_state: 'available' }),
        newContent: null,
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('PKG_DELETED_WITHOUT_LOG')
  })

  it('rejeita deleção de pacote locked sem log entry', () => {
    const staged: StagedFile[] = [
      {
        path: pkgPath(),
        status: 'D',
        oldContent: makePackageJson({ promotion_state: 'locked' }),
        newContent: null,
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('PKG_DELETED_WITHOUT_LOG')
  })

  it('rejeita deleção de pacote available quando log existe mas não tem entry para este UUID', () => {
    const otherUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
    const staged: StagedFile[] = [
      {
        path: pkgPath(VALID_UUID),
        status: 'D',
        oldContent: makePackageJson({ equivalence_id: VALID_UUID, promotion_state: 'available' }),
        newContent: null,
      },
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: '',
        newContent: makeLogLine(otherUuid, 'deleted') + '\n',  // entry para outro UUID
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('PKG_DELETED_WITHOUT_LOG')
  })

  it('passa quando pacote locked tem entry invalidated no log', () => {
    const logContent = makeLogLine(VALID_UUID, 'invalidated') + '\n'
    const staged: StagedFile[] = [
      {
        path: pkgPath(),
        status: 'D',
        oldContent: makePackageJson({ promotion_state: 'locked' }),
        newContent: null,
      },
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: '',
        newContent: logContent,
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// REGRA 4 — Mutação em package.json requer lifecycle bump
// ---------------------------------------------------------------------------

describe('Rule 4 — package.json mutation requires lifecycle bump', () => {
  it('passa quando lifecycle é bumped junto com alteração', () => {
    const oldPkg = makePackageJson({
      lifecycle: {
        created_at: VALID_ISO,
        quality_gated_at: VALID_ISO,
        freshness_checked_at: null,
        promoted_at: null,
        promoted_in_commit: null,
      },
    })
    const newPkg = makePackageJson({
      promotion_state: 'locked',
      lifecycle: {
        created_at: VALID_ISO,
        quality_gated_at: VALID_ISO,
        freshness_checked_at: '2026-05-06T15:00:00Z',  // bumped
        promoted_at: null,
        promoted_in_commit: null,
      },
    })
    const staged: StagedFile[] = [
      { path: pkgPath(), status: 'M', oldContent: oldPkg, newContent: newPkg },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('rejeita mutação em package.json sem nenhum campo lifecycle alterado', () => {
    const pkg = makePackageJson({})
    const modifiedPkg = makePackageJson({ promotion_state: 'locked' })
    // promotion_state mudou mas lifecycle ficou idêntico
    const staged: StagedFile[] = [
      { path: pkgPath(), status: 'M', oldContent: pkg, newContent: modifiedPkg },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.code).toBe('PKG_JSON_NO_LIFECYCLE_BUMP')
  })

  it('passa quando package.json não foi modificado (A — novo arquivo)', () => {
    const staged: StagedFile[] = [
      { path: pkgPath(), status: 'A', oldContent: null, newContent: makePackageJson({}) },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('passa quando conteúdo do package.json é idêntico (sem mudança real)', () => {
    const pkg = makePackageJson({})
    const staged: StagedFile[] = [
      { path: pkgPath(), status: 'M', oldContent: pkg, newContent: pkg },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PR legítimo — deve passar em todas as regras
// ---------------------------------------------------------------------------

describe('PR legítimo (happy path)', () => {
  it('passa com adição de novo pacote + nova linha no log', () => {
    const newPkg = makePackageJson({ promotion_state: 'available' })
    const newLogLine = makeLogLine(VALID_UUID, 'invalidated')
    const staged: StagedFile[] = [
      { path: pkgPath(), status: 'A', oldContent: null, newContent: newPkg },
      {
        path: LOG_PATH,
        status: 'M',
        oldContent: '',
        newContent: newLogLine + '\n',
      },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('ignora arquivos fora do diretório stockpile', () => {
    const staged: StagedFile[] = [
      { path: 'src/lib/blog/post-schema.ts', status: 'M', oldContent: 'old', newContent: 'new' },
      { path: 'package.json', status: 'M', oldContent: '{}', newContent: '{"x":1}' },
    ]
    const result = validateMutations(staged, STOCKPILE_DIR)
    expect(result.valid).toBe(true)
  })

  it('retorna valid=true com diff vazio', () => {
    const result = validateMutations([], STOCKPILE_DIR)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
