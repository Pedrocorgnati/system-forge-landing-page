'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { PortfolioProject } from '@/lib/types'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { cn } from '@/lib/utils'

type FilterValue = 'all' | 'fullstack' | 'website' | 'mobile' | 'ai' | 'crypto' | 'sugestoes'

const filterTabs: { label: string; value: FilterValue }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Fullstack', value: 'fullstack' },
  { label: 'Website', value: 'website' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'IA', value: 'ai' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Sugestões', value: 'sugestoes' },
]

interface PortfolioFilteredListProps {
  projects: PortfolioProject[]
}

/**
 * PortfolioFilteredList — lista completa de portfólio com filtro client-side.
 * Recebe todos os projetos (reais + sugestões) via prop.
 */
export function PortfolioFilteredList({ projects }: PortfolioFilteredListProps) {
  const [filter, setFilter] = useState<FilterValue>('all')

  const filteredProjects = useMemo(() => {
    if (filter === 'all') return projects.filter(p => !p.suggested)
    if (filter === 'sugestoes') return projects.filter(p => p.suggested)
    return projects.filter(p => !p.suggested && p.filters?.includes(filter))
  }, [projects, filter])

  const totalReal = projects.filter(p => !p.suggested).length

  return (
    <div className="flex flex-col gap-6">
      {/* Botões de filtro */}
      <div
        className="overflow-x-auto flex gap-2 pb-2 -mx-4 px-4"
        role="group"
        aria-label="Filtrar projetos por categoria"
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            aria-pressed={filter === tab.value}
            className={cn(
              'shrink-0 flex-shrink-0 px-4 min-h-[44px] rounded-full text-sm font-medium transition-all duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
              filter === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : tab.value === 'sugestoes'
                  ? 'border border-dashed border-border bg-background text-muted-foreground hover:border-primary/40'
                  : 'border border-border bg-background text-foreground hover:border-primary/40',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {filter === 'sugestoes'
          ? `${filteredProjects.length} sugestões de projetos`
          : filteredProjects.length === 1
            ? 'Mostrando 1 projeto'
            : `Mostrando ${filteredProjects.length} de ${totalReal} projetos`}
      </p>

      {/* Nota de sugestões */}
      {filter === 'sugestoes' && (
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg px-4 py-3">
          Estes são projetos fictícios gerados como sugestão de portfólio. Não foram desenvolvidos pela SystemForge.
        </p>
      )}

      {/* Grid ou Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 col-span-full">
          <p className="text-muted-foreground">
            Nenhum projeto nesta categoria ainda.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Novos projetos são adicionados continuamente.
          </p>
          <button
            onClick={() => setFilter('all')}
            className="mt-4 text-primary underline text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
          >
            Ver todos os projetos →
          </button>
        </div>
      ) : (
        <div
          role="list"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProjects.map((project) => (
            <div
              key={project.slug}
              role="listitem"
              className="flex flex-col gap-4 rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Media: vídeo ou imagem */}
              <div className="relative aspect-video w-full overflow-hidden bg-surface">
                {project.videoUrl ? (
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={project.coverImage}
                  >
                    <source src={project.videoUrl} type="video/mp4" />
                  </video>
                ) : project.coverImage ? (
                  <OptimizedImage
                    src={project.coverImage}
                    alt={`Projeto ${project.name}`}
                    width={400}
                    height={225}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : null}

                {project.suggested && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground backdrop-blur-sm">
                    Sugestão
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 p-5 flex-1">
                <h3 className="font-semibold text-foreground leading-snug">
                  {project.name}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                  {project.description}
                </p>

                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-accent text-accent-foreground font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-accent text-accent-foreground font-medium">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {project.url && (
                  <Link
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver projeto ${project.name} (abre em nova aba)`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm w-fit mt-auto"
                  >
                    Ver projeto <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
