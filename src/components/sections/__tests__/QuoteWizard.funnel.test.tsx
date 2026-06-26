// @vitest-environment jsdom
/**
 * QuoteWizard — funnel PostHog (Item 016)
 *
 * Cobre os 6 criterios de aceite da task-016-instrumentar-funnel-posthog:
 *  AC1 - quote_wizard_step_view unico por entrada em etapa (step_index/step_key).
 *  AC2 - quote_wizard_step_complete em etapa valida; etapa invalida NAO emite.
 *  AC3 - quote_wizard_abandon unico ao sair antes de um submit bem-sucedido.
 *  AC4 - quote_submit_success unico + nenhum abandon no mesmo ciclo.
 *  AC5 - quote_submit_error com error_kind ao falhar o submit.
 *  AC6 - sem desfecho duplicado em duplo-clique no submit.
 *
 * O submit e exercido pela prop onSubmit (resolve = sucesso, reject = erro),
 * sem rede real. Os eventos de funil novos NAO removem form_submit/lead_qualified.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'

const capture = vi.fn()
const identifyEmail = vi.fn((_email: string) => Promise.resolve())

vi.mock('@/lib/tracking/posthog', () => ({
  capture: (event: string, props?: Record<string, unknown>) =>
    capture(event, props),
  identifyEmail: (email: string) => identifyEmail(email),
}))

import { QuoteWizard } from '../QuoteWizard'

function eventsNamed(name: string): Array<Record<string, unknown>> {
  return capture.mock.calls
    .filter((c) => c[0] === name)
    .map((c) => (c[1] ?? {}) as Record<string, unknown>)
}

/** Avanca o wizard preenchendo cada etapa com dados validos ate o step 5. */
function fillUntilReview(): void {
  // Step 1 - service
  fireEvent.click(screen.getByTestId('service-card-landing-page'))
  fireEvent.click(screen.getByTestId('wizard-next'))
  // Step 2 - description (>= 20 chars)
  fireEvent.change(screen.getByTestId('field-description-control'), {
    target: {
      value: 'Preciso de uma landing page de alta conversao para captar leads.',
    },
  })
  fireEvent.click(screen.getByTestId('wizard-next'))
  // Step 3 - details (budget + timeline)
  fireEvent.click(screen.getByTestId('field-budgetRange-option-5k-15k'))
  fireEvent.click(screen.getByTestId('field-timeline-option-1-3months'))
  fireEvent.click(screen.getByTestId('wizard-next'))
  // Step 4 - contact
  fireEvent.change(screen.getByTestId('field-name-control'), {
    target: { value: 'Maria Silva' },
  })
  fireEvent.change(screen.getByTestId('field-email-control'), {
    target: { value: 'maria@example.com' },
  })
  fireEvent.change(screen.getByTestId('field-whatsapp-control'), {
    target: { value: '+5511999998888' },
  })
  fireEvent.click(screen.getByTestId('wizard-next'))
}

describe('QuoteWizard funnel PostHog (Item 016)', () => {
  beforeEach(() => {
    capture.mockClear()
    identifyEmail.mockClear()
  })

  it('AC1: dispara um unico quote_wizard_step_view por entrada na etapa', () => {
    render(<QuoteWizard />)
    const initial = eventsNamed('quote_wizard_step_view')
    expect(initial).toHaveLength(1)
    expect(initial[0]).toMatchObject({
      step_index: 1,
      step_key: 'service',
      source: 'quote_wizard',
    })

    // Avancar para o step 2 -> novo view (service + description)
    fireEvent.click(screen.getByTestId('service-card-landing-page'))
    fireEvent.click(screen.getByTestId('wizard-next'))
    const views = eventsNamed('quote_wizard_step_view')
    expect(views).toHaveLength(2)
    expect(views[1]).toMatchObject({ step_index: 2, step_key: 'description' })

    // Voltar -> novo view legitimo do step 1
    fireEvent.click(screen.getByTestId('wizard-back'))
    const afterBack = eventsNamed('quote_wizard_step_view')
    expect(afterBack).toHaveLength(3)
    expect(afterBack[2]).toMatchObject({ step_index: 1, step_key: 'service' })
  })

  it('AC2: etapa valida emite step_complete; etapa invalida NAO emite', () => {
    render(<QuoteWizard />)
    // Sem selecionar servico: botao next fica disabled (canProceed=false) -> nada
    fireEvent.click(screen.getByTestId('wizard-next'))
    expect(eventsNamed('quote_wizard_step_complete')).toHaveLength(0)

    // Selecionar servico valido e avancar -> complete do step 1
    fireEvent.click(screen.getByTestId('service-card-landing-page'))
    fireEvent.click(screen.getByTestId('wizard-next'))
    const completes = eventsNamed('quote_wizard_step_complete')
    expect(completes).toHaveLength(1)
    expect(completes[0]).toMatchObject({
      step_index: 1,
      step_key: 'service',
      source: 'quote_wizard',
    })
  })

  it('AC3: sair antes do submit dispara um unico quote_wizard_abandon', () => {
    const { unmount } = render(<QuoteWizard />)
    fireEvent.click(screen.getByTestId('service-card-landing-page'))
    fireEvent.click(screen.getByTestId('wizard-next'))
    unmount()
    const abandons = eventsNamed('quote_wizard_abandon')
    expect(abandons).toHaveLength(1)
    expect(abandons[0]).toMatchObject({
      last_step_index: 2,
      last_step_key: 'description',
      reason: 'unmount',
    })
  })

  it('AC4: submit com sucesso dispara um quote_submit_success e nenhum abandon', async () => {
    const onSubmit = vi.fn(() => Promise.resolve())
    const { unmount } = render(<QuoteWizard onSubmit={onSubmit} />)
    fillUntilReview()
    fireEvent.click(screen.getByTestId('wizard-submit'))

    await waitFor(() =>
      expect(eventsNamed('quote_submit_success')).toHaveLength(1),
    )
    expect(eventsNamed('quote_submit_success')[0]).toMatchObject({
      service_id: 'landing-page',
      budget_range: '5k-15k',
      timeline: '1-3months',
      source: 'quote_wizard',
    })
    expect(eventsNamed('quote_submit_error')).toHaveLength(0)

    // Apos sucesso, sair NAO emite abandon (submitSucceeded suprime).
    unmount()
    expect(eventsNamed('quote_wizard_abandon')).toHaveLength(0)
  })

  it('AC5: submit com erro dispara quote_submit_error com error_kind', async () => {
    const onSubmit = vi.fn(() => Promise.reject(new Error('boom')))
    render(<QuoteWizard onSubmit={onSubmit} />)
    fillUntilReview()
    fireEvent.click(screen.getByTestId('wizard-submit'))

    await waitFor(() =>
      expect(eventsNamed('quote_submit_error')).toHaveLength(1),
    )
    expect(eventsNamed('quote_submit_error')[0]).toMatchObject({
      error_kind: 'CALLBACK_ERROR',
      source: 'quote_wizard',
    })
    expect(eventsNamed('quote_submit_success')).toHaveLength(0)
  })

  it('AC6: duplo-clique no submit nao duplica o desfecho', async () => {
    let resolveSubmit: () => void = () => {}
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolveSubmit = res
        }),
    )
    render(<QuoteWizard onSubmit={onSubmit} />)
    fillUntilReview()

    const submitBtn = screen.getByTestId('wizard-submit')
    fireEvent.click(submitBtn) // entra em loading; botao fica disabled
    fireEvent.click(submitBtn) // no-op (disabled) — protecao de duplo-clique

    await act(async () => {
      resolveSubmit()
      await Promise.resolve()
    })

    await waitFor(() =>
      expect(eventsNamed('quote_submit_success')).toHaveLength(1),
    )
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('preserva form_submit e lead_qualified existentes nao e exigido no caminho onSubmit', async () => {
    // No caminho onSubmit, form_submit ainda dispara (regressao guard).
    const onSubmit = vi.fn(() => Promise.resolve())
    render(<QuoteWizard onSubmit={onSubmit} />)
    fillUntilReview()
    fireEvent.click(screen.getByTestId('wizard-submit'))
    await waitFor(() =>
      expect(eventsNamed('form_submit')).toHaveLength(1),
    )
    expect(eventsNamed('form_submit')[0]).toMatchObject({
      source: 'quote_wizard',
    })
  })
})
