import type { ReactNode } from 'react'

export type RadioGroupFieldProps = {
  id: string
  name: string
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  error?: string
  onChange: (value: string) => void
}

export function RadioGroupField({ id, name, label, options, value, error, onChange }: RadioGroupFieldProps): ReactNode {
  const errorId = error ? `${id}-error` : undefined
  return (
    // wrapper: a fieldset e o limite externo do campo (data-testid="field-{name}");
    // control: o grid de opcoes (data-testid="field-{name}-control") agrupa os radios.
    <fieldset
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={errorId}
      data-form-field={name}
      data-testid={`field-${name}`}
      className="flex flex-col gap-2.5 border-0 p-0 m-0"
    >
      <legend className="text-sm font-medium text-foreground">
        {label}
        <span aria-hidden="true" className="text-destructive ml-0.5">*</span>
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid={`field-${name}-control`}>
        {options.map((opt) => {
          const optionId = `${id}-${opt.value}`
          const checked = value === opt.value
          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              data-testid={`field-${name}-option-${opt.value}`}
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
        <p id={errorId} role="alert" data-testid={`field-${name}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
