import { ServiceCard } from '@/components/shared/ServiceCard'
import type { Service, ServiceData } from '@/lib/types'

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
      data-testid="services-list-grid"
      role="list"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {services.map((service) => (
        <div key={service.slug} role="listitem">
          <ServiceCard
            service={{
              slug: service.slug,
              name: service.name ?? service.label ?? service.slug,
              description: service.description,
              longDescription: service.longDescription ?? service.description,
              icon: service.icon,
              category: service.category ?? service.slug,
            } satisfies Service}
          />
        </div>
      ))}
    </div>
  )
}
