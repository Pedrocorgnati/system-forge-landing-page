/**
 * components/blog/ArticleCard.tsx
 * Card de artigo para listagens do blog.
 * Server Component — sem 'use client'.
 */
import Link from 'next/link'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { ROUTES } from '@/lib/constants/routes'
import type { ArticleFrontmatter } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { loadMessages } from '@config/content'

interface ArticleCardProps {
  article: ArticleFrontmatter
  variant?: 'default' | 'compact' | 'featured'
  index?: number
}

export function ArticleCard({ article, variant = 'default', index = 0 }: ArticleCardProps) {
  const m = loadMessages()
  const coverSrc = article.coverImage || '/images/blog/default-cover.png'
  const primaryTag = article.tags[0]
  const isFeatured = variant === 'featured'
  const formattedDate = formatDate(article.date)

  return (
    <article
      data-testid={`blog-article-card-${article.slug}`}
      data-blog-reveal
      style={{ '--reveal-delay': `${index * 120}ms` } as React.CSSProperties}
      className={[
        'card-elevated flex rounded-2xl border border-border bg-card overflow-hidden',
        isFeatured ? 'flex-col md:flex-row' : 'flex-col',
      ].join(' ')}
    >
      {/* Cover Image */}
      <Link
        href={ROUTES.BLOG_POST(article.slug)}
        className={[
          'card-image-wrapper block overflow-hidden shrink-0',
          isFeatured ? 'h-56 md:h-auto md:w-2/5' : variant === 'compact' ? 'h-36' : 'h-52',
        ].join(' ')}
        tabIndex={-1}
        aria-hidden="true"
      >
        <OptimizedImage
          src={coverSrc}
          alt={article.title}
          fill
          width={0}
          height={0}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.04]"
        />
      </Link>

      {/* Card Body */}
      <div className={[
        'flex flex-col gap-3 flex-1',
        isFeatured ? 'p-6 md:p-7' : 'p-5',
      ].join(' ')}>

        {/* Featured label — somente no featured */}
        {isFeatured && (
          <span className="text-[11px] font-bold text-primary uppercase tracking-[0.15em] leading-none">
            {m.blog.featured}
          </span>
        )}

        {/* Tag badge */}
        {primaryTag && (
          <span className="card-tag inline-block w-fit text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {primaryTag}
          </span>
        )}

        {/* Title */}
        <h3 className={[
          'font-semibold text-foreground',
          isFeatured
            ? 'text-xl md:text-2xl leading-[1.2] tracking-[-0.02em]'
            : 'text-[0.9375rem] leading-[1.35] tracking-[-0.01em]',
        ].join(' ')}>
          <Link
            href={ROUTES.BLOG_POST(article.slug)}
            className={[
              'hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded',
              isFeatured ? '' : 'line-clamp-2',
            ].join(' ')}
          >
            {article.title}
          </Link>
        </h3>

        {/* Description — somente em default e featured */}
        {variant !== 'compact' && (
          <p className="text-[0.8125rem] text-muted-foreground leading-[1.65] tracking-[0.005em] line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Footer: author + date + reading time */}
        <div className="card-meta mt-auto flex items-center gap-1.5 text-[0.75rem] text-muted-foreground leading-none tracking-[0.01em]">
          {article.author && (
            <>
              <span className="font-semibold text-foreground/80">{article.author}</span>
              <span className="text-border" aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={article.date} className="tabular-nums">{formattedDate}</time>
          {article.readingTime !== undefined && (
            <>
              <span className="text-border" aria-hidden="true">·</span>
              <span className="tabular-nums">{article.readingTime} min</span>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
