export default function ServicoLoading() {
  return (
    <div
      data-testid="servico-loading"
      role="status"
      aria-label="Carregando serviço..."
      className="py-12 md:py-16 bg-background"
    >
      <span className="sr-only">Carregando serviço...</span>
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-col gap-8 max-w-3xl">

          {/* Breadcrumb skeleton */}
          <div className="flex gap-2">
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </div>

          {/* Back link skeleton */}
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />

          {/* Icon + title skeleton */}
          <div className="flex flex-col gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
          </div>

          {/* Related services skeleton */}
          <div className="flex flex-col gap-4 pt-8 border-t border-border">
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
