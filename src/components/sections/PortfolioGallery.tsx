'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { PortfolioCard } from '@/components/shared/PortfolioCard'
import { portfolioProjects } from '@/lib/data'
import { ServiceCategory } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
  all: 'Todos',
  [ServiceCategory.SAAS]: 'SaaS',
  [ServiceCategory.MOBILE]: 'Mobile',
  [ServiceCategory.ECOMMERCE]: 'E-commerce',
  [ServiceCategory.DASHBOARD]: 'Dashboard',
  [ServiceCategory.AI]: 'IA',
  [ServiceCategory.MARKETPLACE]: 'Marketplace',
  [ServiceCategory.ERP]: 'ERP',
  [ServiceCategory.API]: 'API',
  [ServiceCategory.CHATBOT]: 'Chatbot',
  [ServiceCategory.LANDING]: 'Landing Page',
}

const filterTabs = [
  'all',
  ServiceCategory.SAAS,
  ServiceCategory.MOBILE,
  ServiceCategory.AI,
  ServiceCategory.ECOMMERCE,
  ServiceCategory.MARKETPLACE,
  ServiceCategory.DASHBOARD,
]

export function PortfolioGallery() {
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const filtered =
    activeFilter === 'all'
      ? portfolioProjects
      : portfolioProjects.filter((p) => p.category === activeFilter)

  return (
    <section
      id="portfolio"
      data-testid="section-portfolio"
      aria-label="Portfólio de projetos"
      className="w-full bg-surface py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                Portfólio
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Projetos que entregamos
              </h2>
              <p className="text-muted-foreground">
                {portfolioProjects.length} projetos e contando.
              </p>
            </div>
            <Link
              href={ROUTES.portfolio}
              data-testid="portfolio-view-all-link"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md"
            >
              Ver portfólio completo
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Filters */}
          <div
            data-testid="portfolio-filters"
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            role="tablist"
            aria-label="Filtrar por categoria"
          >
            {filterTabs.map((cat) => (
              <button
                key={cat}
                role="tab"
                data-testid={`portfolio-filter-${cat}`}
                aria-selected={activeFilter === cat}
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  'min-h-[36px]',
                  activeFilter === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-foreground hover:border-primary/40',
                )}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.slice(0, 9).map((project) => (
                <PortfolioCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border border-border border-dashed bg-background">
              <span className="text-4xl" aria-hidden="true">🔍</span>
              <p className="font-medium text-foreground">Nenhum projeto nessa categoria ainda</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
              >
                Ver todos os projetos
              </button>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
