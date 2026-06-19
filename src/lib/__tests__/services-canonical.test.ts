import { describe, it, expect } from 'vitest'
import { services, allServiceSlugs, getServiceBySlug } from '@/lib/data'

/**
 * Regressão recorrente (3x): cards de serviço duplicados na grid.
 * Causa-raiz: slugs-irmãos com o mesmo conteúdo entravam em `services`,
 * que é renderizado 1:1 pela ServicesGrid -> dois cards idênticos.
 * Estes testes travam a invariante canônica.
 */
describe('services — lista canônica (anti-duplicação)', () => {
  it('não tem slug duplicado', () => {
    const slugs = services.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('não tem card com nome + descrição idênticos (sintoma visual do bug)', () => {
    const fingerprints = services.map((s) => `${s.name}::${s.description}`)
    expect(new Set(fingerprints).size).toBe(fingerprints.length)
  })

  it('todo slug canônico também aparece em allServiceSlugs', () => {
    for (const s of services) {
      expect(allServiceSlugs).toContain(s.slug)
    }
  })

  it('allServiceSlugs não tem duplicatas', () => {
    expect(new Set(allServiceSlugs).size).toBe(allServiceSlugs.length)
  })

  it('getServiceBySlug resolve slugs canônicos e aliases para o mesmo serviço', () => {
    // alias -> canônico (rota antiga não pode quebrar)
    expect(getServiceBySlug('e-commerce')?.slug).toBe('ecommerce')
    expect(getServiceBySlug('aplicativo-mobile')?.slug).toBe('mobile')
    expect(getServiceBySlug('dashboard-b2b')?.slug).toBe('dashboard')
    expect(getServiceBySlug('api-integracoes')?.slug).toBe('api')
    expect(getServiceBySlug('bots-automacoes')?.slug).toBe('chatbot')
    // canônico resolve para si mesmo
    expect(getServiceBySlug('saas')?.slug).toBe('saas')
    // inexistente -> undefined (alimenta notFound())
    expect(getServiceBySlug('nao-existe')).toBeUndefined()
  })
})
