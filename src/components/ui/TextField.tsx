import type { ReactNode } from 'react'

export type TextFieldProps = {
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

export function TextField({
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
    <div className="flex flex-col gap-1.5" data-testid={`field-${name}`}>
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
        data-testid={`field-${name}-control`}
        className="w-full px-3 py-2.5 text-base rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/30"
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" data-testid={`field-${name}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
