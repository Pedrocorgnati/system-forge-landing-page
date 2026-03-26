import { ServiceCard } from '@/components/shared/ServiceCard'
import type { ServiceData } from '@/lib/types'

interface ServicesListProps {
  services: ServiceData[]
}

/**
 * ServicesList — grid responsivo de cards de serviço.
 * Server Component: sem 'use client'.
 * INT-024: 11 categorias de serviço.
 */
export function ServicesList({ services }: ServicesListProps) {
  if (services.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Nenhum serviço disponível no momento.
      </p>
    )
  }

  return (
    <div
      role="list"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {services.map((service) => (
        <div key={service.slug} role="listitem">
          <ServiceCard service={service} />
        </div>
      ))}
    </div>
  )
}
