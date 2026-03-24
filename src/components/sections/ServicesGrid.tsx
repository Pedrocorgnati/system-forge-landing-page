import { Container } from '@/components/ui/Container'
import { ServiceCard } from '@/components/shared/ServiceCard'
import { services } from '@/lib/data'

export function ServicesGrid() {
  return (
    <section
      id="servicos"
      data-testid="section-services"
      aria-label="Nossos serviços"
      className="w-full bg-background py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              O que fazemos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Soluções completas para cada etapa do seu negócio
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Do MVP ao produto escalável — desenvolvemos software sob medida em todas
              as frentes que seu negócio precisa.
            </p>
          </div>

          {/* Grid */}
          <div data-testid="services-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
