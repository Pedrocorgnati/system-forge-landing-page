import { FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ message, icon, action, className }: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="w-16 h-16 text-foreground/20 mx-auto">
        {icon ?? <FolderOpen className="w-16 h-16" />}
      </div>
      <p className="mt-4 text-lg font-medium text-foreground/60 text-center">{message}</p>
      {action && (
        <button
          data-testid="empty-state-action-button"
          onClick={action.onClick}
          className="mt-6 px-6 py-3 min-h-[44px] rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
