'use client'

import { useRef, useCallback } from 'react'
import type { PortfolioProject } from '@/lib/types'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { cn } from '@/lib/utils'

interface PortfolioCardProps {
  project: PortfolioProject
  className?: string
}

export function PortfolioCard({ project, className }: PortfolioCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const techs = project.techs ?? project.technologies ?? []
  const title = project.title ?? project.name ?? 'Projeto'
  const coverImage = project.coverImage ?? project.imageUrl

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play()
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [])

  return (
    <div
      data-testid={`portfolio-card-${project.slug}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group flex flex-col gap-4 rounded-xl border border-border bg-card overflow-hidden',
        'hover:border-primary/40 hover:shadow-md transition-all duration-200',
        project.featured && 'ring-1 ring-primary/20',
        className,
      )}
    >
      {/* Video / Image preview */}
      <div className="relative aspect-video overflow-hidden bg-surface">
        {project.videoUrl ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
              loop
              preload="metadata"
              aria-hidden="true"
            >
              <source src={project.videoUrl} type="video/mp4" />
            </video>
            {/* Gradient overlay — visible on hover */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-hidden="true"
            />
          </>
        ) : coverImage ? (
          <OptimizedImage
            src={coverImage}
            alt={`Preview do projeto ${title}`}
            width={640}
            height={360}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="h-full w-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted-foreground/30" aria-hidden="true">
            🖥️
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 px-5 pb-5">
        <h3 className="font-semibold text-foreground leading-snug">{title}</h3>

        <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-2">
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
    </div>
  )
}
