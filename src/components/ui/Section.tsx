import { cn } from '@/lib/utils'

interface SectionProps {
  children: React.ReactNode
  id?: string
  className?: string
  ariaLabel?: string
}

export function Section({ children, id, className, ariaLabel }: SectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn('w-full', className)}
    >
      {children}
    </section>
  )
}
