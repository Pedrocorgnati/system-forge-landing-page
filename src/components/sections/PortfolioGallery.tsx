'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { PortfolioCard } from '@/components/shared/PortfolioCard'
import { EmptyStatePortfolio } from '@/components/shared/EmptyStatePortfolio'
import { portfolioProjects } from '@/lib/data'
import { ServiceCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()
const locale = config.locale

const ALL_LABEL =
  locale === 'it-IT' ? 'Tutti' : locale === 'en' ? 'All' : 'Todos'

const categoryLabels: Record<string, string> = {
  all: ALL_LABEL,
  [ServiceCategory.SAAS]: 'SaaS',
  [ServiceCategory.MOBILE]: 'Mobile',
  [ServiceCategory.ECOMMERCE]: 'E-commerce',
  [ServiceCategory.DASHBOARD]: 'Dashboard',
  [ServiceCategory.AI]: locale === 'it-IT' ? 'AI' : locale === 'en' ? 'AI' : 'IA',
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
      : portfolioProjects.filter((p) => p.categories.includes(activeFilter as ServiceCategory))

  return (
    <section
      id="portfolio"
      data-testid="section-portfolio"
      aria-label={messages.sections.portfolio.ariaLabel}
      className="w-full bg-surface py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                {locale === 'it-IT' ? 'Portfolio' : locale === 'en' ? 'Portfolio' : 'Portfólio'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {locale === 'it-IT' ? 'Progetti che abbiamo consegnato' : locale === 'en' ? 'Projects we have delivered' : 'Projetos que entregamos'}
              </h2>
              <p className="text-muted-foreground">
                {portfolioProjects.length} {locale === 'it-IT' ? 'progetti e in crescita.' : locale === 'en' ? 'projects and counting.' : 'projetos e contando.'}
              </p>
            </div>
            <Link
              href={config.routes.portfolio}
              data-testid="portfolio-view-all-link"
              className="shrink-0 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md"
            >
              {messages.cta.portfolio}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Filters */}
          <div
            data-testid="portfolio-filters"
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            role="tablist"
            aria-label={locale === 'it-IT' ? 'Filtra per categoria' : locale === 'en' ? 'Filter by category' : 'Filtrar por categoria'}
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
                <PortfolioCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            <EmptyStatePortfolio onReset={() => setActiveFilter('all')} />
          )}
        </div>
      </Container>
    </section>
  )
}
