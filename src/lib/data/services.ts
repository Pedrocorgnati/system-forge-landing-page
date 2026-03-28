/**
 * lib/data/services.ts
 * Serviços da SystemForge — fonte de dados: content/pt-BR/pages/services.json
 */
import servicesJson from '../../../content/pt-BR/pages/services.json'
import type { ServiceData, ServiceCategory } from '../types'

export const servicesData: ServiceData[] = servicesJson.map(s => ({
  slug: s.slug as ServiceCategory,
  label: s.label,
  description: s.description,
  icon: s.icon,
}))

/** Busca serviço por slug (ServiceCategory) */
export function getServiceBySlug(slug: ServiceCategory): ServiceData | undefined {
  return servicesData.find(s => s.slug === slug)
}
