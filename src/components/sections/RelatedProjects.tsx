import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import type { PortfolioProject } from '@/lib/types'
import { ROUTES } from '@/lib/constants'

interface RelatedProjectsProps {
  projects: PortfolioProject[]
  serviceName: string
}

/**
 * RelatedProjects — grid de projetos relacionados ao serviço.
 * Server Component: sem 'use client'.
 * FEAT-PS-004, FEAT-PS-006: Cross-linking serviço → projetos + empty state.
 */
export function RelatedProjects({ projects, serviceName }: RelatedProjectsProps) {
  return (
    <Section id="projetos-relacionados">
      <Container>
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Projetos Relacionados
          </h2>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Em breve novos projetos em {serviceName}.</p>
              <p className="mt-2">
                <Link
                  href={ROUTES.PORTFOLIO}
                  className="underline hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
                >
                  Ver todos os projetos do portfólio →
                </Link>
              </p>
            </div>
          ) : (
            <div
              role="list"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {projects.map((project) => (
                <div
                  key={project.slug}
                  role="listitem"
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  {project.coverImage && (
                    <div className="relative aspect-video w-full overflow-hidden bg-surface">
                      <OptimizedImage
                        src={project.coverImage}
                        alt={`Projeto ${project.name} — ${project.description.slice(0, 60)}`}
                        width={400}
                        height={225}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 p-5">
                    <h3 className="font-semibold text-foreground leading-snug">
                      {project.name}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-accent text-accent-foreground font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver projeto ${project.name} (abre em nova aba)`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm w-fit mt-auto"
                      >
                        Ver projeto <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
