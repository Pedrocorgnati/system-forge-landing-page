import type { ReactNode } from 'react'

export type SelectFieldProps = {
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

export function SelectField({
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
    <div className="flex flex-col gap-1.5" data-testid={`field-${name}`}>
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
        data-testid={`field-${name}-control`}
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
        <p id={errorId} role="alert" data-testid={`field-${name}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
