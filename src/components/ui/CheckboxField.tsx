import type { ReactNode } from 'react'

export type CheckboxFieldProps = {
  id: string
  name: string
  label: string
  checked: boolean
  error?: string
  policyLink: ReactNode
  onChange: (value: boolean) => void
}

export function CheckboxField({ id, name, label, checked, error, policyLink, onChange }: CheckboxFieldProps): ReactNode {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="flex flex-col gap-1.5" data-testid={`field-${name}`}>
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
          data-testid={`field-${name}-control`}
          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
        />
        <span className="leading-relaxed">
          {label}{' '}
          <span className="inline-block">{policyLink}</span>
        </span>
      </label>
      {error ? (
        <p id={errorId} role="alert" data-testid={`field-${name}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
