'use client'

import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

export type WizardStepMeta = {
  title: string
  description: string
}

export type WizardProgressBarProps = {
  steps: ReadonlyArray<WizardStepMeta>
  current: number
  indicator: string
}

/**
 * Barra de progresso do QuoteWizard (Item 014).
 * Indica o passo atual (1..N) e os passos ja concluidos. Labels 100% vindos do
 * catalogo `quote-wizard.json` (`wizard.steps[].title` e `wizard.indicator`),
 * nenhuma string hardcoded.
 */
export function WizardProgressBar({
  steps,
  current,
  indicator,
}: WizardProgressBarProps): ReactNode {
  const total = steps.length
  return (
    <div className="flex flex-col gap-4" data-testid="wizard-progress">
      <p
        aria-live="polite"
        data-wizard-step={current}
        className="text-sm font-medium text-muted-foreground"
      >
        {indicator}
      </p>
      <ol className="flex w-full items-center gap-2" role="list">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < current
          const isCurrent = stepNumber === current
          const status = isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
          return (
            <li
              key={step.title}
              data-wizard-step-status={status}
              data-testid={`wizard-progress-step-${stepNumber}`}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex flex-1 flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              <span
                aria-hidden="true"
                className={`h-1 w-full rounded-full transition-colors ${
                  stepNumber <= current ? 'bg-primary' : 'bg-border'
                }`}
              />
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-muted-foreground sm:hidden">
        {steps[current - 1]?.title ?? ''} ({current}/{total})
      </p>
    </div>
  )
}
