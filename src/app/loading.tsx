import { loadMessages } from '@config/content'

const messages = loadMessages()

export default function Loading() {
  return (
    <div
      data-testid="page-loading"
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label={messages.pages.loading.label}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <span className="sr-only">{messages.pages.loading.label}</span>
    </div>
  )
}
