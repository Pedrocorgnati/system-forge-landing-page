import type { PortfolioProject } from '@/lib/types'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { STATUS_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface PortfolioCardProps {
  project: PortfolioProject
  className?: string
}

export function PortfolioCard({ project, className }: PortfolioCardProps) {
  const statusCfg =
    STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.completed
  const techs = project.techs ?? project.technologies ?? []
  const title = project.title ?? project.name ?? 'Projeto'
  const coverImage = project.coverImage ?? project.imageUrl

  return (
    <div
      data-testid={`portfolio-card-${project.id}`}
      className={cn(
        'flex flex-col gap-4 p-6 rounded-xl border border-border bg-card',
        'hover:border-primary/40 hover:shadow-md transition-all duration-200',
        project.featured && 'ring-1 ring-primary/20',
        className,
      )}
    >
      {coverImage ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-surface">
          <OptimizedImage
            src={coverImage}
            alt={`Preview do projeto ${title}`}
            width={640}
            height={360}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="h-full w-full"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground leading-snug">{title}</h3>
        <span
          className={cn(
            'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            statusCfg.className,
          )}
        >
          {statusCfg.label}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {techs.map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-accent text-accent-foreground font-medium"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  )
}
