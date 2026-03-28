/**
 * src/lib/blog/__tests__/post-schema.test.ts
 * Testes unitários do PostFrontmatterSchema.
 *
 * Cobre: 11 casos obrigatórios + casos de defaults.
 * Rastreabilidade: INT-045, INT-077
 */

import { describe, it, expect } from 'vitest'
import { PostFrontmatterSchema } from '../post-schema'

// Frontmatter válido completo para usar como base nos testes.
const validBase = {
  title: 'Meu artigo de blog completo',
  date: '2026-03-28',
  slug: 'meu-artigo-de-blog-completo',
  locale: 'pt-BR' as const,
  excerpt:
    'Este é o excerpt do artigo com pelo menos cinquenta caracteres para passar na validação do schema.',
  tags: ['nextjs', 'typescript'],
  published: true,
  exclusive: false,
  hreflang_pair: [],
  author: 'Pedro Corgnati',
}

describe('PostFrontmatterSchema', () => {
  // -------------------------------------------------------------------------
  // Caso 1: Frontmatter válido completo
  // -------------------------------------------------------------------------
  it('aceita frontmatter válido completo', () => {
    const result = PostFrontmatterSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Caso 2: Frontmatter sem coverImage (campo opcional)
  // -------------------------------------------------------------------------
  it('aceita frontmatter sem coverImage (campo opcional)', () => {
    const data = { ...validBase }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).coverImage
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Caso 3: Defaults aplicados corretamente
  // -------------------------------------------------------------------------
  it('aplica defaults para published, exclusive e author', () => {
    const data = {
      title: 'Artigo sem defaults explícitos',
      date: '2026-03-28',
      slug: 'artigo-sem-defaults',
      locale: 'pt-BR' as const,
      excerpt:
        'Excerpt com pelo menos cinquenta caracteres para satisfazer o schema do módulo.',
      tags: ['test'],
    }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.published).toBe(true)
      expect(result.data.exclusive).toBe(false)
      expect(result.data.author).toBe('Pedro Corgnati')
      expect(result.data.hreflang_pair).toEqual([])
    }
  })

  // -------------------------------------------------------------------------
  // Caso 4: title ausente
  // -------------------------------------------------------------------------
  it('rejeita frontmatter sem title', () => {
    const { title: _omitted, ...data } = validBase
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('title')
    }
  })

  // -------------------------------------------------------------------------
  // Caso 5: date com formato inválido
  // -------------------------------------------------------------------------
  it('rejeita date com formato inválido', () => {
    const data = { ...validBase, date: '28-03-2026' }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('YYYY-MM-DD'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 6: slug com caracteres inválidos
  // -------------------------------------------------------------------------
  it('rejeita slug com caracteres inválidos (espaços, maiúsculas)', () => {
    const data = { ...validBase, slug: 'Meu Artigo!' }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('letras, números e hífens'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 7: excerpt muito curto (menos de 50 chars)
  // -------------------------------------------------------------------------
  it('rejeita excerpt com menos de 50 chars', () => {
    const data = { ...validBase, excerpt: 'curto' }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('mínimo 50 chars'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 8: tags vazio
  // -------------------------------------------------------------------------
  it('rejeita tags vazio (necessário mínimo 1 tag)', () => {
    const data = { ...validBase, tags: [] }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('Pelo menos 1 tag'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 9: exclusive=true + hreflang_pair preenchido (conflito)
  // -------------------------------------------------------------------------
  it('rejeita exclusive=true com hreflang_pair preenchido', () => {
    const data = {
      ...validBase,
      exclusive: true,
      hreflang_pair: [{ locale: 'it-IT' as const, slug: 'mio-articolo' }],
    }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('exclusive'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 10: self-reference em hreflang_pair
  // -------------------------------------------------------------------------
  it('rejeita self-reference em hreflang_pair (mesmo locale do artigo)', () => {
    const data = {
      ...validBase,
      locale: 'pt-BR' as const,
      hreflang_pair: [{ locale: 'pt-BR' as const, slug: 'outro-artigo' }],
    }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('self-reference'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 11: locales duplicados em hreflang_pair
  // -------------------------------------------------------------------------
  it('rejeita locales duplicados em hreflang_pair', () => {
    const data = {
      ...validBase,
      hreflang_pair: [
        { locale: 'it-IT' as const, slug: 'articolo-1' },
        { locale: 'it-IT' as const, slug: 'articolo-2' },
      ],
    }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map(i => i.message)
      expect(msgs.some(m => m.includes('Locale duplicado'))).toBe(true)
    }
  })

  // -------------------------------------------------------------------------
  // Caso 12: hreflang_pair válido com referências múltiplas
  // -------------------------------------------------------------------------
  it('aceita hreflang_pair válido com múltiplos locales diferentes', () => {
    const data = {
      ...validBase,
      hreflang_pair: [
        { locale: 'it-IT' as const, slug: 'mio-articolo' },
        { locale: 'en' as const, slug: 'my-article' },
      ],
    }
    const result = PostFrontmatterSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})
