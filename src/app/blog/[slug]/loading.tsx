import { loadMessages } from '@config/content'

const m = loadMessages()

export default function BlogPostLoading() {
  return (
    <div
      data-testid="blog-post-loading"
      role="status"
      aria-label={m.pages.loading.label}
      className="mx-auto max-w-3xl px-4 py-12 md:py-16"
    >
      <span className="sr-only">{m.pages.loading.label}</span>

      {/* Breadcrumb skeleton */}
      <div className="mb-8 flex gap-2">
        <div className="h-4 w-10 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>

      {/* Cover image skeleton */}
      <div className="mb-8 h-56 w-full animate-pulse rounded-2xl bg-muted sm:h-72" />

      {/* Tags skeleton */}
      <div className="mb-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Title skeleton */}
      <div className="mb-3 h-9 w-3/4 animate-pulse rounded-lg bg-muted" />
      <div className="mb-6 h-9 w-1/2 animate-pulse rounded-lg bg-muted" />

      {/* Meta skeleton */}
      <div className="mb-8 flex gap-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>

      {/* Body paragraphs skeleton */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: i % 3 === 2 ? '70%' : '100%' }}
          />
        ))}
      </div>
    </div>
  )
}
