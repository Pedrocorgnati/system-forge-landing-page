'use client'

import { useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import {
  Passo1Schema,
  Passo2Schema,
  LeadPayloadSchema,
  type Budget,
  type Channel,
  type LeadPayload,
  type SoftwareType,
  type Urgency,
} from '@/lib/validation/leadSchema'
import copy from '@content/pt-BR/pages/lead-qualifier.json'
import { capture as posthogCapture, identifyEmail } from '@/lib/tracking/posthog'

type Passo1State = {
  fullName: string
  email: string
  company: string
}

type Passo2State = {
  softwareType: SoftwareType | ''
  urgency: Urgency | ''
  budget: Budget | ''
  channel: Channel | ''
  lgpdConsent: boolean
}

type FieldErrors = Record<string, string | undefined>

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }

const ERROR_LABELS: Record<string, string> = {
  'form.errors.fullName.min': copy.errors.fullName.min,
  'form.errors.fullName.max': copy.errors.fullName.max,
  'form.errors.email.format': copy.errors.email.format,
  'form.errors.email.max': copy.errors.email.max,
  'form.errors.company.required': copy.errors.company.required,
  'form.errors.company.max': copy.errors.company.max,
  'form.errors.softwareType.required': copy.errors.softwareType.required,
  'form.errors.urgency.required': copy.errors.urgency.required,
  'form.errors.budget.required': copy.errors.budget.required,
  'form.errors.channel.required': copy.errors.channel.required,
  'form.errors.lgpdConsent.required': copy.errors.lgpdConsent.required,
}

function resolveErrorMessage(message: string): string {
  return ERROR_LABELS[message] ?? message
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    template,
  )
}

export type LeadQualifierFormProps = {
  onSubmitPayload?: (payload: LeadPayload) => Promise<void>
}

export function LeadQualifierForm({ onSubmitPayload }: LeadQualifierFormProps) {
  const fieldsId = useId()
  const formStartedRef = useRef(false)
  const passo2HeadingRef = useRef<HTMLHeadingElement | null>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [passo1, setPasso1] = useState<Passo1State>({ fullName: '', email: '', company: '' })
  const [passo2, setPasso2] = useState<Passo2State>({
    softwareType: '',
    urgency: '',
    budget: '',
    channel: '',
    lgpdConsent: false,
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' })

  function markFormStartedOnce(): void {
    if (!formStartedRef.current) {
      formStartedRef.current = true
      posthogCapture('form_start', { source: 'lead_qualifier' })
    }
  }

  function handlePasso1Change<K extends keyof Passo1State>(key: K, value: Passo1State[K]): void {
    markFormStartedOnce()
    setPasso1((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function handlePasso2Change<K extends keyof Passo2State>(key: K, value: Passo2State[K]): void {
    markFormStartedOnce()
    setPasso2((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function handleAdvance(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const parsed = Passo1Schema.safeParse(passo1)
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && next[field] === undefined) {
          next[field] = resolveErrorMessage(issue.message)
        }
      }
      setErrors(next)
      return
    }
    setErrors({})
    posthogCapture('form_step_advance', { from_step: '1', to_step: '2' })
    setStep(2)
    queueMicrotask(() => {
      passo2HeadingRef.current?.focus()
    })
  }

  function handleBack(): void {
    setErrors({})
    setStep(1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const parsed = Passo2Schema.safeParse(passo2)
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && next[field] === undefined) {
          next[field] = resolveErrorMessage(issue.message)
        }
      }
      setErrors(next)
      return
    }

    const fullPayload = LeadPayloadSchema.safeParse({ ...passo1, ...parsed.data })
    if (!fullPayload.success) {
      setSubmitState({ kind: 'error', message: copy.errors.submit.generic })
      return
    }

    setErrors({})
    setSubmitState({ kind: 'loading' })
    posthogCapture('form_submit', { source: 'lead_qualifier' })

    try {
      if (onSubmitPayload) {
        await onSubmitPayload(fullPayload.data)
      }
      // Static export bloqueia route handlers — disparamos lead_qualified
      // client-side (mesma semantica, sem servidor). Email vai como hash
      // SHA-256 via identifyEmail (NUNCA plain).
      void identifyEmail(fullPayload.data.email)
      posthogCapture('lead_qualified', {
        source: 'lead_qualifier',
        software_type: fullPayload.data.softwareType,
        urgency: fullPayload.data.urgency,
        budget: fullPayload.data.budget,
        channel: fullPayload.data.channel,
      })
      setSubmitState({ kind: 'success' })
    } catch (_err) {
      setSubmitState({ kind: 'error', message: copy.errors.submit.generic })
    }
  }

  function handleSubmitAgain(): void {
    setStep(1)
    setPasso1({ fullName: '', email: '', company: '' })
    setPasso2({ softwareType: '', urgency: '', budget: '', channel: '', lgpdConsent: false })
    setErrors({})
    setSubmitState({ kind: 'idle' })
    formStartedRef.current = false
  }

  if (submitState.kind === 'success') {
    return (
      <section
        id="solicitar-escopo"
        data-testid="section-lead-qualifier"
        aria-label={copy.section.ariaLabel}
        className="relative w-full bg-background"
      >
        <Container>
          <div className="py-16 md:py-20">
            <div
              role="status"
              aria-live="polite"
              data-form-state="success"
              className="max-w-2xl mx-auto rounded-2xl border border-success/40 bg-success/5 p-8 md:p-10 flex flex-col gap-4 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/15 mx-auto">
                <CheckCircle2 size={28} className="text-success" aria-hidden="true" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {copy.states.success.title}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {copy.states.success.description}
              </p>
              <p className="text-sm text-muted-foreground">{copy.states.success.next}</p>
              <button
                type="button"
                onClick={handleSubmitAgain}
                data-form-event="reset"
                className="inline-flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {copy.actions.submitAgain}
              </button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  const stepIndicator = interpolate(copy.steps.indicator, {
    current: String(step),
    total: '2',
  })

  return (
    <section
      id="solicitar-escopo"
      data-testid="section-lead-qualifier"
      aria-label={copy.section.ariaLabel}
      className="relative w-full bg-background"
    >
      <Container>
        <div className="py-16 md:py-20 lg:py-24 flex flex-col gap-10">
          <header className="max-w-2xl flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
              {copy.section.eyebrow}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
              {copy.section.headline}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {copy.section.subheadline}
            </p>
            <p
              aria-live="polite"
              className="text-sm font-medium text-muted-foreground"
              data-form-step={step}
            >
              {stepIndicator}
            </p>
          </header>

          <form
            noValidate
            onSubmit={step === 1 ? handleAdvance : handleSubmit}
            data-form-step={step}
            data-form-event={
              step === 1 ? (formStartedRef.current ? 'form_step1_in_progress' : 'form_start') : 'form_step_advance'
            }
            className="max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8 lg:p-10 flex flex-col gap-6"
          >
            {step === 1 ? (
              <Step1Fields
                fieldsId={fieldsId}
                values={passo1}
                errors={errors}
                onChange={handlePasso1Change}
              />
            ) : (
              <Step2Fields
                fieldsId={fieldsId}
                values={passo2}
                errors={errors}
                headingRef={passo2HeadingRef}
                onChange={handlePasso2Change}
              />
            )}

            {submitState.kind === 'error' ? (
              <p
                role="alert"
                data-form-state="error"
                className="text-sm font-medium text-destructive"
              >
                {submitState.message}
              </p>
            ) : null}

            {submitState.kind === 'loading' ? (
              <p
                role="status"
                aria-live="polite"
                data-form-state="loading"
                className="text-sm font-medium text-muted-foreground"
              >
                {copy.states.loading}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  data-form-event="form_step_back"
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-lg"
                >
                  {copy.actions.back}
                </button>
              ) : null}
              <button
                type="submit"
                data-form-event={step === 1 ? 'form_step_advance_request' : 'form_submit'}
                disabled={submitState.kind === 'loading'}
                className="group inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {step === 1
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
      </Container>
    </section>
  )
}

type Step1FieldsProps = {
  fieldsId: string
  values: Passo1State
  errors: FieldErrors
  onChange: <K extends keyof Passo1State>(key: K, value: Passo1State[K]) => void
}

function Step1Fields({ fieldsId, values, errors, onChange }: Step1FieldsProps): ReactNode {
  return (
    <fieldset className="flex flex-col gap-5 border-0 p-0 m-0">
      <legend className="sr-only">{copy.steps.passo1.title}</legend>
      <div>
        <h3 className="text-xl font-semibold text-foreground">{copy.steps.passo1.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{copy.steps.passo1.description}</p>
      </div>

      <TextField
        id={`${fieldsId}-fullName`}
        name="fullName"
        type="text"
        label={copy.fields.fullName.label}
        placeholder={copy.fields.fullName.placeholder}
        autoComplete={copy.fields.fullName.autocomplete}
        value={values.fullName}
        error={errors.fullName}
        onChange={(v) => onChange('fullName', v)}
        required
      />

      <TextField
        id={`${fieldsId}-email`}
        name="email"
        type="email"
        label={copy.fields.email.label}
        placeholder={copy.fields.email.placeholder}
        autoComplete={copy.fields.email.autocomplete}
        hint={copy.fields.email.hint}
        value={values.email}
        error={errors.email}
        onChange={(v) => onChange('email', v)}
        required
      />

      <TextField
        id={`${fieldsId}-company`}
        name="company"
        type="text"
        label={copy.fields.company.label}
        placeholder={copy.fields.company.placeholder}
        autoComplete={copy.fields.company.autocomplete}
        value={values.company}
        error={errors.company}
        onChange={(v) => onChange('company', v)}
        required
      />
    </fieldset>
  )
}

type Step2FieldsProps = {
  fieldsId: string
  values: Passo2State
  errors: FieldErrors
  headingRef: RefObject<HTMLHeadingElement | null>
  onChange: <K extends keyof Passo2State>(key: K, value: Passo2State[K]) => void
}

function Step2Fields({ fieldsId, values, errors, headingRef, onChange }: Step2FieldsProps): ReactNode {
  return (
    <fieldset className="flex flex-col gap-6 border-0 p-0 m-0">
      <legend className="sr-only">{copy.steps.passo2.title}</legend>
      <div>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-foreground outline-none"
        >
          {copy.steps.passo2.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{copy.steps.passo2.description}</p>
      </div>

      <SelectField
        id={`${fieldsId}-softwareType`}
        name="softwareType"
        label={copy.fields.softwareType.label}
        placeholder={copy.fields.softwareType.placeholder}
        options={copy.fields.softwareType.options}
        value={values.softwareType}
        error={errors.softwareType}
        onChange={(v) => onChange('softwareType', v as SoftwareType | '')}
        required
      />

      <RadioGroupField
        id={`${fieldsId}-urgency`}
        name="urgency"
        label={copy.fields.urgency.label}
        options={copy.fields.urgency.options}
        value={values.urgency}
        error={errors.urgency}
        onChange={(v) => onChange('urgency', v as Urgency)}
      />

      <RadioGroupField
        id={`${fieldsId}-budget`}
        name="budget"
        label={copy.fields.budget.label}
        options={copy.fields.budget.options}
        value={values.budget}
        error={errors.budget}
        onChange={(v) => onChange('budget', v as Budget)}
      />

      <RadioGroupField
        id={`${fieldsId}-channel`}
        name="channel"
        label={copy.fields.channel.label}
        options={copy.fields.channel.options}
        value={values.channel}
        error={errors.channel}
        onChange={(v) => onChange('channel', v as Channel)}
      />

      <CheckboxField
        id={`${fieldsId}-lgpdConsent`}
        name="lgpdConsent"
        label={copy.fields.lgpdConsent.label}
        checked={values.lgpdConsent}
        error={errors.lgpdConsent}
        onChange={(v) => onChange('lgpdConsent', v)}
        policyLink={
          <Link
            href={copy.fields.lgpdConsent.policyHref}
            className="text-primary hover:text-primary/80 underline underline-offset-4"
          >
            {copy.fields.lgpdConsent.policyLinkLabel}
          </Link>
        }
      />
    </fieldset>
  )
}

type TextFieldProps = {
  id: string
  name: string
  type: 'text' | 'email'
  label: string
  placeholder?: string
  autoComplete?: string
  hint?: string
  value: string
  error?: string
  required?: boolean
  onChange: (value: string) => void
}

function TextField({
  id,
  name,
  type,
  label,
  placeholder,
  autoComplete,
  hint,
  value,
  error,
  required,
  onChange,
}: TextFieldProps): ReactNode {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span aria-hidden="true" className="text-destructive ml-0.5">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        aria-required={required ? 'true' : undefined}
        data-form-field={name}
        className="w-full px-3 py-2.5 text-base rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/30"
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type SelectFieldProps = {
  id: string
  name: string
  label: string
  placeholder: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  error?: string
  required?: boolean
  onChange: (value: string) => void
}

function SelectField({
  id,
  name,
  label,
  placeholder,
  options,
  value,
  error,
  required,
  onChange,
}: SelectFieldProps): ReactNode {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span aria-hidden="true" className="text-destructive ml-0.5">*</span> : null}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        aria-required={required ? 'true' : undefined}
        data-form-field={name}
        className="w-full px-3 py-2.5 text-base rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/30"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type RadioGroupFieldProps = {
  id: string
  name: string
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  error?: string
  onChange: (value: string) => void
}

function RadioGroupField({ id, name, label, options, value, error, onChange }: RadioGroupFieldProps): ReactNode {
  const errorId = error ? `${id}-error` : undefined
  return (
    <fieldset
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={errorId}
      data-form-field={name}
      className="flex flex-col gap-2.5 border-0 p-0 m-0"
    >
      <legend className="text-sm font-medium text-foreground">
        {label}
        <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const optionId = `${id}-${opt.value}`
          const checked = value === opt.value
          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                checked
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/60'
              }`}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

type CheckboxFieldProps = {
  id: string
  name: string
  label: string
  checked: boolean
  error?: string
  policyLink: ReactNode
  onChange: (value: boolean) => void
}

function CheckboxField({ id, name, label, checked, error, policyLink, onChange }: CheckboxFieldProps): ReactNode {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-foreground cursor-pointer">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          aria-required="true"
          data-form-field={name}
          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
        />
        <span className="leading-relaxed">
          {label}{' '}
          <span className="inline-block">{policyLink}</span>
        </span>
      </label>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
