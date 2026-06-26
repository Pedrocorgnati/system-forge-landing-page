'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Pencil, ShieldCheck } from 'lucide-react'
import { getSiteConfig } from '@config'
import { Container, RadioGroupField, TextField } from '@/components/ui'
import {
  quoteWizardSchema,
  SERVICE_ID_TO_TYPE,
  type QuoteWizardValues,
} from '@/lib/validation/quoteWizardSchema'
import { submitQuoteLead } from '@/lib/services/quote-lead'
import { capture as posthogCapture, identifyEmail } from '@/lib/tracking/posthog'
import copy from '@content/pt-BR/pages/quote-wizard.json'
import { WizardProgressBar } from './QuoteWizardProgressBar'

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string
      remove: (widgetId: string) => void
      reset: (widgetId?: string) => void
    }
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js'

type ExtraQuestion = { id: string; label: string; placeholder: string }

type FieldErrors = Record<string, string | undefined>

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

type WizardData = {
  serviceId: string
  description: string
  budgetRange: string
  timeline: string
  discovery: Record<string, string>
  referralSource: string
  name: string
  email: string
  whatsapp: string
}

const INITIAL_DATA: WizardData = {
  serviceId: '',
  description: '',
  budgetRange: '',
  timeline: '',
  discovery: {},
  referralSource: '',
  name: '',
  email: '',
  whatsapp: '',
}

const TOTAL_STEPS = 5

// Mapa estavel step (1..5) -> chave de etapa, casando com os data-testid do
// wizard (wizard-step-{key}). Usado nas propriedades dos eventos de funil
// PostHog (Item 016) — step_key/last_step_key.
const STEP_KEYS = ['service', 'description', 'details', 'contact', 'review'] as const

function stepKeyFor(index: number): string {
  return STEP_KEYS[index - 1] ?? 'unknown'
}

// Mapa key-de-erro do schema -> copy do catalogo. Sem fallback hardcoded: o
// schema emite chaves i18n (`form.errors.*`) e o texto vem 100% de
// quote-wizard.json (Item 009, bloco `errors`).
const ERROR_LABELS: Record<string, string> = {
  'form.errors.name.min': copy.errors.name.min,
  'form.errors.email.format': copy.errors.email.format,
  'form.errors.whatsapp.min': copy.errors.whatsapp.min,
  'form.errors.whatsapp.max': copy.errors.whatsapp.max,
  'form.errors.whatsapp.format': copy.errors.whatsapp.format,
  'form.errors.projectType.required': copy.errors.projectType.required,
  'form.errors.description.min': copy.errors.description.min,
  'form.errors.description.max': copy.errors.description.max,
  'form.errors.budgetRange.required': copy.errors.budgetRange.required,
  'form.errors.timeline.required': copy.errors.timeline.required,
}

function resolveErrorMessage(message: string): string {
  return ERROR_LABELS[message] ?? message
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template,
  )
}

function getExtraQuestions(serviceId: string): ExtraQuestion[] {
  const map = copy.projectDetails.extraQuestions as Record<
    string,
    ExtraQuestion[]
  >
  return map[serviceId] ?? []
}

function projectTypeFor(serviceId: string): string | undefined {
  return serviceId ? SERVICE_ID_TO_TYPE[serviceId] : undefined
}

export type QuoteWizardProps = {
  // Item 015 liga o submit ao Worker; aqui o token e o payload sao apenas
  // entregues a este callback opcional (default: sucesso client-side).
  onSubmit?: (payload: QuoteWizardValues, turnstileToken: string) => Promise<void>
}

export function QuoteWizard({ onSubmit }: QuoteWizardProps): ReactNode {
  const fieldsId = useId()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' })
  const [turnstileToken, setTurnstileToken] = useState('')

  // ---- Funnel PostHog (Item 016) ----
  // submitSucceeded: suprime o evento de abandono apos um submit bem-sucedido.
  // abandonSent: garante no maximo um quote_wizard_abandon por ciclo de vida.
  // outcomeFired: garante no maximo um evento de desfecho (success XOR error)
  //   por tentativa de submit (dedup contra duplo-clique e re-render).
  // lastStep: ultima etapa "vista", lida no cleanup/beforeunload (closures
  //   capturam valor estavel; o ref carrega o step corrente).
  const submitSucceededRef = useRef(false)
  const abandonSentRef = useRef(false)
  const outcomeFiredRef = useRef(false)
  const lastStepRef = useRef(step)

  // quote_wizard_step_view: dispara uma vez por ENTRADA na etapa (mount inicial
  // = entrada no step 1; "voltar" muda o step e conta como novo view legitimo).
  useEffect(() => {
    lastStepRef.current = step
    posthogCapture('quote_wizard_step_view', {
      step_index: step,
      step_key: stepKeyFor(step),
      source: 'quote_wizard',
    })
  }, [step])

  // quote_wizard_abandon: saida do wizard (unmount) ou beforeunload SEM submit
  // bem-sucedido. Suprimido apos sucesso (submitSucceededRef); no maximo um
  // disparo (abandonSentRef).
  useEffect(() => {
    function fireAbandon(reason: 'unmount' | 'beforeunload'): void {
      if (submitSucceededRef.current || abandonSentRef.current) return
      abandonSentRef.current = true
      const idx = lastStepRef.current
      posthogCapture('quote_wizard_abandon', {
        last_step_index: idx,
        last_step_key: stepKeyFor(idx),
        reason,
      })
    }
    function onBeforeUnload(): void {
      fireAbandon('beforeunload')
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      fireAbandon('unmount')
    }
  }, [])

  const handleToken = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  function patch(partial: Partial<WizardData>): void {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function clearError(field: string): void {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function buildPayload(): Record<string, unknown> {
    const features = getExtraQuestions(data.serviceId)
      .map((q) => {
        const answer = (data.discovery[q.id] ?? '').trim()
        return answer ? `${q.label}: ${answer}` : ''
      })
      .filter((entry) => entry.length > 0)

    return {
      name: data.name.trim(),
      email: data.email.trim(),
      whatsapp: data.whatsapp.trim(),
      projectType: projectTypeFor(data.serviceId),
      description: data.description.trim(),
      budgetRange: data.budgetRange,
      timeline: data.timeline,
      features: features.length > 0 ? features : undefined,
      referralSource: data.referralSource || undefined,
    }
  }

  // Gate canProceed: valida a FATIA do quoteWizardSchema correspondente a etapa.
  function validateStep(target: number): FieldErrors | null {
    let result
    switch (target) {
      case 1:
        result = quoteWizardSchema
          .pick({ projectType: true })
          .safeParse({ projectType: projectTypeFor(data.serviceId) })
        break
      case 2:
        result = quoteWizardSchema
          .pick({ description: true })
          .safeParse({ description: data.description.trim() })
        break
      case 3:
        result = quoteWizardSchema
          .pick({ budgetRange: true, timeline: true })
          .safeParse({ budgetRange: data.budgetRange, timeline: data.timeline })
        break
      case 4:
        result = quoteWizardSchema
          .pick({ name: true, email: true, whatsapp: true })
          .safeParse({
            name: data.name.trim(),
            email: data.email.trim(),
            whatsapp: data.whatsapp.trim(),
          })
        break
      default:
        result = quoteWizardSchema.safeParse(buildPayload())
    }
    if (result.success) return null
    const next: FieldErrors = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      const key = field === 'projectType' ? 'serviceId' : field
      if (typeof key === 'string' && next[key] === undefined) {
        next[key] = resolveErrorMessage(issue.message)
      }
    }
    return next
  }

  const canProceed = validateStep(step) === null

  function handleAdvance(): void {
    const stepErrors = validateStep(step)
    if (stepErrors) {
      setErrors(stepErrors)
      return
    }
    // Etapa valida -> quote_wizard_step_complete (etapa reprovada NAO emite).
    posthogCapture('quote_wizard_step_complete', {
      step_index: step,
      step_key: stepKeyFor(step),
      source: 'quote_wizard',
    })
    setErrors({})
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }

  function handleBack(): void {
    setErrors({})
    setStep((prev) => Math.max(prev - 1, 1))
  }

  function goToStep(target: number): void {
    setErrors({})
    setStep(target)
  }

  // Desfecho de funil: no maximo UM evento (success XOR error) por tentativa.
  // outcomeFiredRef e zerado no inicio de cada tentativa (handleSubmit), logo um
  // novo clique apos erro reabre o desfecho; duplo-clique na mesma tentativa nao
  // reemite (guard + botao disabled em loading).
  function fireSubmitSuccess(values: QuoteWizardValues): void {
    if (outcomeFiredRef.current) return
    outcomeFiredRef.current = true
    submitSucceededRef.current = true
    posthogCapture('quote_submit_success', {
      service_id: data.serviceId,
      budget_range: values.budgetRange,
      timeline: values.timeline,
      source: 'quote_wizard',
    })
  }

  function fireSubmitError(errorKind: string, httpStatus?: number): void {
    if (outcomeFiredRef.current) return
    outcomeFiredRef.current = true
    posthogCapture('quote_submit_error', {
      error_kind: errorKind,
      ...(httpStatus !== undefined ? { http_status: httpStatus } : {}),
      source: 'quote_wizard',
    })
  }

  async function handleSubmit(): Promise<void> {
    // Anti duplo-disparo: ignora reentrada enquanto um submit esta pendente.
    if (submitState.kind === 'loading') return

    const parsed = quoteWizardSchema.safeParse(buildPayload())
    if (!parsed.success) {
      const stepErrors = validateStep(TOTAL_STEPS)
      if (stepErrors) setErrors(stepErrors)
      return
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) return

    // Nova tentativa: reabre o desfecho (sucesso ou erro reais, abaixo).
    outcomeFiredRef.current = false

    setErrors({})
    setSubmitState({ kind: 'loading' })
    posthogCapture('form_submit', { source: 'quote_wizard' })

    // Override de teste/integracao: quando onSubmit e injetado, ele decide o
    // fluxo (storybook, e2e). Caso contrario, o submit real vai ao Quote Worker.
    if (onSubmit) {
      try {
        await onSubmit(parsed.data, turnstileToken)
        fireSubmitSuccess(parsed.data)
        setSubmitState({ kind: 'success' })
      } catch {
        fireSubmitError('CALLBACK_ERROR')
        setSubmitState({ kind: 'error', message: copy.errors.submit.generic })
      }
      return
    }

    // Enviamos o serviceId CRU (o Worker deriva projectType) + consent + locale
    // + turnstileToken. consent === true: o envio explicito do pedido constitui
    // o consentimento exigido pelo Worker (CONSENT_REQUIRED quando ausente).
    const result = await submitQuoteLead({
      serviceId: data.serviceId,
      description: parsed.data.description,
      budgetRange: parsed.data.budgetRange,
      timeline: parsed.data.timeline,
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      consent: true,
      locale: getSiteConfig().locale,
      turnstileToken,
      referralSource: parsed.data.referralSource,
    })

    // Static export bloqueia route handlers — disparamos lead_qualified
    // client-side (mesma semantica do LeadQualifierForm). Email como hash
    // SHA-256 via identifyEmail (NUNCA plain).
    void identifyEmail(parsed.data.email)
    posthogCapture('lead_qualified', {
      source: 'quote_wizard',
      project_type: parsed.data.projectType,
      budget: parsed.data.budgetRange,
      timeline: parsed.data.timeline,
      outcome: result.success ? 'submitted' : 'backend_error',
    })

    // Desfecho de funil segue SEMPRE o resultado real de rede/HTTP, mesmo no
    // modo degradado (a UI converge para sucesso, o analytics nao). 2xx ->
    // quote_submit_success; 400/403/429/5xx/TIMEOUT/NETWORK_ERROR ->
    // quote_submit_error. Mutuamente exclusivos, no maximo um por tentativa.
    if (result.success) {
      fireSubmitSuccess(parsed.data)
    } else {
      fireSubmitError(result.error ?? 'UNKNOWN', result.status)
    }

    // Modo degradado: 201/202 (sucesso) e tambem 400/403/429/5xx/TIMEOUT/
    // NETWORK_ERROR convergem para a tela de sucesso. O lead ja foi capturado no
    // PostHog (outcome:backend_error) para follow-up manual — Zero Silencio,
    // Zero Fluxos Incompletos, sem deadend para o usuario.
    setSubmitState({ kind: 'success' })
  }

  function handleReset(): void {
    setStep(1)
    setData(INITIAL_DATA)
    setErrors({})
    setSubmitState({ kind: 'idle' })
    setTurnstileToken('')
  }

  const indicator = interpolate(copy.wizard.indicator, {
    current: String(step),
    total: String(TOTAL_STEPS),
  })

  if (submitState.kind === 'success') {
    return (
      <WizardShell>
        <div
          role="status"
          aria-live="polite"
          data-wizard-state="success"
          className="mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-success/40 bg-success/5 p-8 text-center md:p-10"
        >
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 size={28} className="text-success" aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {copy.states.success}
          </p>
          <button
            type="button"
            onClick={handleReset}
            data-testid="wizard-reset"
            className="mx-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {copy.actions.next}
          </button>
        </div>
      </WizardShell>
    )
  }

  return (
    <WizardShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            {copy.header.title}
            <span className="text-primary">{copy.header.titleHighlight}</span>
            {copy.header.titleAfter}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.header.subtitle}
          </p>
          <ul className="flex flex-wrap gap-2">
            {copy.header.badges.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
              >
                {badge}
              </li>
            ))}
          </ul>
        </header>

        <WizardProgressBar
          steps={copy.wizard.steps}
          current={step}
          indicator={indicator}
        />

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (step < TOTAL_STEPS) {
              handleAdvance()
            } else {
              void handleSubmit()
            }
          }}
          data-wizard-step={step}
          data-testid="quote-wizard-form"
          className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8"
        >
          {step === 1 ? (
            <StepServiceType
              fieldsId={fieldsId}
              value={data.serviceId}
              error={errors.serviceId}
              onSelect={(serviceId) => {
                clearError('serviceId')
                patch({ serviceId })
              }}
            />
          ) : null}

          {step === 2 ? (
            <StepDescription
              fieldsId={fieldsId}
              value={data.description}
              error={errors.description}
              onChange={(description) => {
                clearError('description')
                patch({ description })
              }}
            />
          ) : null}

          {step === 3 ? (
            <StepDetails
              fieldsId={fieldsId}
              data={data}
              errors={errors}
              onBudget={(budgetRange) => {
                clearError('budgetRange')
                patch({ budgetRange })
              }}
              onTimeline={(timeline) => {
                clearError('timeline')
                patch({ timeline })
              }}
              onDiscovery={(id, answer) =>
                patch({ discovery: { ...data.discovery, [id]: answer } })
              }
              onReferral={(referralSource) => patch({ referralSource })}
            />
          ) : null}

          {step === 4 ? (
            <StepContact
              fieldsId={fieldsId}
              data={data}
              errors={errors}
              onChange={(field, value) => {
                clearError(field)
                patch({ [field]: value } as Partial<WizardData>)
              }}
            />
          ) : null}

          {step === 5 ? (
            <StepReview
              data={data}
              token={turnstileToken}
              onToken={handleToken}
              onEdit={goToStep}
            />
          ) : null}

          {submitState.kind === 'error' ? (
            <p
              role="alert"
              data-wizard-state="error"
              className="text-sm font-medium text-destructive"
            >
              {submitState.message}
            </p>
          ) : null}

          {submitState.kind === 'loading' ? (
            <p
              role="status"
              aria-live="polite"
              data-wizard-state="loading"
              className="text-sm font-medium text-muted-foreground"
            >
              {copy.states.loading}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                data-testid="wizard-back"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {copy.actions.back}
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              data-testid={step < TOTAL_STEPS ? 'wizard-next' : 'wizard-submit'}
              disabled={
                !canProceed ||
                submitState.kind === 'loading' ||
                (step === TOTAL_STEPS && Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)
              }
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step < TOTAL_STEPS
                ? copy.actions.next
                : submitState.kind === 'loading'
                  ? copy.actions.submitting
                  : copy.actions.submit}
              <ArrowRight
                size={18}
                className="transition-transform duration-150 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          </div>
        </form>
      </div>
    </WizardShell>
  )
}

function WizardShell({ children }: { children: ReactNode }): ReactNode {
  return (
    <section
      id="solicitar-escopo"
      data-testid="section-lead-qualifier"
      className="relative w-full bg-background"
    >
      <Container>
        <div className="py-16 md:py-20 lg:py-24">{children}</div>
      </Container>
    </section>
  )
}

type StepServiceTypeProps = {
  fieldsId: string
  value: string
  error?: string
  onSelect: (serviceId: string) => void
}

function StepServiceType({
  fieldsId,
  value,
  error,
  onSelect,
}: StepServiceTypeProps): ReactNode {
  const meta = copy.wizard.steps[0]
  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0" data-testid="wizard-step-service">
      <legend className="sr-only">{meta?.title}</legend>
      <StepHeading title={meta?.title} description={meta?.description} />
      <div
        role="radiogroup"
        aria-label={meta?.title}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {copy.serviceType.types.map((type) => {
          const selected = value === type.id
          return (
            <button
              key={type.id}
              type="button"
              role="radio"
              aria-checked={selected}
              id={`${fieldsId}-service-${type.id}`}
              data-testid={`service-card-${type.id}`}
              onClick={() => onSelect(type.id)}
              className={`flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : 'border-border bg-background hover:border-primary/60'
              }`}
            >
              <span className="text-sm font-semibold text-foreground">
                {type.label}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {type.description}
              </span>
            </button>
          )
        })}
      </div>
      {error ? (
        <p role="alert" data-testid="wizard-error-service" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

type StepDescriptionProps = {
  fieldsId: string
  value: string
  error?: string
  onChange: (value: string) => void
}

function StepDescription({
  fieldsId,
  value,
  error,
  onChange,
}: StepDescriptionProps): ReactNode {
  const meta = copy.wizard.steps[1]
  const errorId = error ? `${fieldsId}-description-error` : undefined
  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0" data-testid="wizard-step-description">
      <legend className="sr-only">{meta?.title}</legend>
      <StepHeading title={meta?.title} description={meta?.description} />
      <div className="flex flex-col gap-1.5" data-testid="field-description">
        <label
          htmlFor={`${fieldsId}-description`}
          className="text-sm font-medium text-foreground"
        >
          {meta?.title}
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        </label>
        <textarea
          id={`${fieldsId}-description`}
          name="description"
          rows={5}
          value={value}
          maxLength={2000}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          data-form-field="description"
          data-testid="field-description-control"
          placeholder={meta?.description}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 aria-[invalid=true]:border-destructive"
        />
        {error ? (
          <p
            id={errorId}
            role="alert"
            data-testid="field-description-error"
            className="text-xs font-medium text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  )
}

type StepDetailsProps = {
  fieldsId: string
  data: WizardData
  errors: FieldErrors
  onBudget: (value: string) => void
  onTimeline: (value: string) => void
  onDiscovery: (id: string, answer: string) => void
  onReferral: (value: string) => void
}

function StepDetails({
  fieldsId,
  data,
  errors,
  onBudget,
  onTimeline,
  onDiscovery,
  onReferral,
}: StepDetailsProps): ReactNode {
  const meta = copy.wizard.steps[2]
  const questions = getExtraQuestions(data.serviceId)
  return (
    <fieldset className="flex flex-col gap-6 border-0 p-0" data-testid="wizard-step-details">
      <legend className="sr-only">{meta?.title}</legend>
      <StepHeading title={meta?.title} description={meta?.description} />

      <RadioGroupField
        id={`${fieldsId}-budget`}
        name="budgetRange"
        label={copy.review.labels.budget}
        options={copy.projectDetails.budgetOptions}
        value={data.budgetRange}
        error={errors.budgetRange}
        onChange={onBudget}
      />

      <RadioGroupField
        id={`${fieldsId}-timeline`}
        name="timeline"
        label={copy.review.labels.timeline}
        options={copy.projectDetails.timelineOptions}
        value={data.timeline}
        error={errors.timeline}
        onChange={onTimeline}
      />

      {questions.map((question) => {
        const inputId = `${fieldsId}-discovery-${question.id}`
        return (
          <div
            key={question.id}
            className="flex flex-col gap-1.5"
            data-testid={`field-discovery-${question.id}`}
          >
            <label htmlFor={inputId} className="text-sm font-medium text-foreground">
              {question.label}
            </label>
            <textarea
              id={inputId}
              name={`discovery-${question.id}`}
              rows={3}
              value={data.discovery[question.id] ?? ''}
              maxLength={1000}
              placeholder={question.placeholder}
              onChange={(event) => onDiscovery(question.id, event.target.value)}
              data-form-field={`discovery-${question.id}`}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )
      })}

      <RadioGroupField
        id={`${fieldsId}-referral`}
        name="referralSource"
        label={copy.review.labels.contact}
        options={copy.contactInfo.referralOptions}
        value={data.referralSource}
        error={undefined}
        onChange={onReferral}
      />
    </fieldset>
  )
}

type StepContactProps = {
  fieldsId: string
  data: WizardData
  errors: FieldErrors
  onChange: (field: 'name' | 'email' | 'whatsapp', value: string) => void
}

function StepContact({
  fieldsId,
  data,
  errors,
  onChange,
}: StepContactProps): ReactNode {
  const meta = copy.wizard.steps[3]
  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0" data-testid="wizard-step-contact">
      <legend className="sr-only">{meta?.title}</legend>
      <StepHeading title={meta?.title} description={meta?.description} />

      <TextField
        id={`${fieldsId}-name`}
        name="name"
        type="text"
        label={copy.contactInfo.labels.name}
        autoComplete="name"
        required
        value={data.name}
        error={errors.name}
        onChange={(value) => onChange('name', value)}
      />

      <TextField
        id={`${fieldsId}-email`}
        name="email"
        type="email"
        label={copy.contactInfo.labels.email}
        autoComplete="email"
        required
        value={data.email}
        error={errors.email}
        onChange={(value) => onChange('email', value)}
      />

      <TextField
        id={`${fieldsId}-whatsapp`}
        name="whatsapp"
        type="text"
        label={copy.contactInfo.labels.whatsapp}
        autoComplete="tel"
        required
        value={data.whatsapp}
        error={errors.whatsapp}
        onChange={(value) => onChange('whatsapp', value)}
      />
    </fieldset>
  )
}

type StepReviewProps = {
  data: WizardData
  token: string
  onToken: (token: string) => void
  onEdit: (step: number) => void
}

function StepReview({ data, token, onToken, onEdit }: StepReviewProps): ReactNode {
  const meta = copy.wizard.steps[4]
  const serviceLabel =
    copy.serviceType.types.find((type) => type.id === data.serviceId)?.label ?? ''
  const budgetLabel =
    copy.projectDetails.budgetOptions.find((opt) => opt.value === data.budgetRange)
      ?.label ?? ''
  const timelineLabel =
    copy.projectDetails.timelineOptions.find((opt) => opt.value === data.timeline)
      ?.label ?? ''

  const rows: Array<{ label: string; value: string; step: number }> = [
    { label: copy.review.labels.service, value: serviceLabel, step: 1 },
    { label: copy.review.labels.description, value: data.description, step: 2 },
    { label: copy.review.labels.budget, value: budgetLabel, step: 3 },
    { label: copy.review.labels.timeline, value: timelineLabel, step: 3 },
    {
      label: copy.review.labels.contact,
      value: [data.name, data.email, data.whatsapp].filter(Boolean).join(' | '),
      step: 4,
    },
  ]

  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0" data-testid="wizard-step-review">
      <legend className="sr-only">{meta?.title}</legend>
      <StepHeading title={meta?.title} description={meta?.description} />

      <dl className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 px-4 py-3"
            data-testid={`review-row-${row.step}`}
          >
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-sm text-foreground">{row.value || '—'}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              data-testid={`review-edit-${row.step}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              <Pencil size={12} aria-hidden="true" />
              {copy.review.labels.edit}
            </button>
          </div>
        ))}
      </dl>

      <TurnstileWidget token={token} onToken={onToken} />
    </fieldset>
  )
}

type TurnstileWidgetProps = {
  token: string
  onToken: (token: string) => void
}

function TurnstileWidget({ token, onToken }: TurnstileWidgetProps): ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let cancelled = false

    function renderWidget(): void {
      if (cancelled || !containerRef.current || widgetIdRef.current) return
      if (!window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY as string,
        callback: (value: string) => onToken(value),
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
        theme: 'auto',
      })
    }

    if (window.turnstile) {
      renderWidget()
      return () => {
        cancelled = true
      }
    }

    let script = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile="true"]',
    )
    if (!script) {
      script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.setAttribute('data-turnstile', 'true')
      document.head.appendChild(script)
    }
    script.addEventListener('load', renderWidget)
    return () => {
      cancelled = true
      script?.removeEventListener('load', renderWidget)
    }
  }, [onToken])

  if (!TURNSTILE_SITE_KEY) {
    return (
      <p
        role="alert"
        data-testid="turnstile-unavailable"
        data-wizard-state="turnstile-unavailable"
        className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive"
      >
        {copy.review.turnstile.unavailable}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2" data-testid="turnstile-container">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <ShieldCheck size={16} aria-hidden="true" />
        {copy.review.turnstile.label}
      </span>
      <div
        ref={containerRef}
        data-testid="turnstile-widget"
        data-turnstile-verified={token ? 'true' : 'false'}
      />
    </div>
  )
}

function StepHeading({
  title,
  description,
}: {
  title?: string
  description?: string
}): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
