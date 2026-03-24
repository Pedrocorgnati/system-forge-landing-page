import Link from 'next/link'
import type { ArticleFrontmatter } from '@/lib/types'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: ArticleFrontmatter
  className?: string
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const date = new Date(article.date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article className={cn('flex flex-col gap-3', className)}>
      <Link
        href={ROUTES.blogSlug(article.slug)}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-xl"
      >
        <div className="aspect-video rounded-xl bg-muted overflow-hidden mb-3 flex items-center justify-center">
          {/* @ASSET_PLACEHOLDER
          name: blog-cover-placeholder
          type: image
          extension: svg
          format: 16:9
          dimensions: 800x450
          description: Imagem de capa para artigo do blog SystemForge. Ilustração conceitual abstrata sobre tecnologia e software.
          context: Card de artigo no blog
          */}
          <span className="text-4xl opacity-30" aria-hidden="true">📝</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
            {article.category}
          </span>
          {article.readingTime && (
            <span className="text-xs text-muted-foreground">{article.readingTime} min de leitura</span>
          )}
        </div>

        <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
      </Link>

      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
        {article.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-muted-foreground">{article.author}</span>
        <time className="text-xs text-muted-foreground" dateTime={article.date}>
          {date}
        </time>
      </div>
    </article>
  )
}
