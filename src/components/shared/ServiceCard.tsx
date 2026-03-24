import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Service } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ServiceCardProps {
  service: Service
  className?: string
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  return (
    <Link
      href={ROUTES.servicoSlug(service.slug)}
      data-testid={`service-card-${service.slug}`}
      className={cn(
        'group flex flex-col gap-3 p-6 rounded-xl border border-border bg-card',
        'hover:border-primary/40 hover:shadow-md transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
        className,
      )}
    >
      <span className="text-3xl leading-none" role="img" aria-label={service.name}>
        {service.icon}
      </span>
      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
        {service.name}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {service.description}
      </p>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-auto">
        Saiba mais
        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  )
}
