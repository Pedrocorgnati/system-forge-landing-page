import Link from 'next/link'
import { loadMessages } from '@config/content'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const messages = loadMessages()

  return (
    <nav data-testid="breadcrumb" aria-label={messages.breadcrumb.ariaLabel} className={cn('py-3', className)}>
      <ol className="flex items-center gap-2 text-sm text-foreground/60 overflow-x-auto">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 whitespace-nowrap">
            {i > 0 && <span aria-hidden="true" className="text-foreground/30">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
