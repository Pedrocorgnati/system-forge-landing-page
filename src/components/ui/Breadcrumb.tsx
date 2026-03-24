import Link from 'next/link'
import { breadcrumbSchema } from '@/lib/schema'
import { JsonLd } from './JsonLd'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const schema = breadcrumbSchema(
    items.map((item) => ({ name: item.label, href: item.href })),
  )

  return (
    <>
      <JsonLd schema={schema} />
      <nav
        aria-label="Navegação estrutural"
        className={cn('text-sm', className)}
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <li key={index} className="flex items-center gap-1.5">
                {!isLast && item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    {item.label}
                  </Link>
                ) : isLast ? (
                  <span aria-current="page" className="text-foreground font-medium">
                    {item.label}
                  </span>
                ) : (
                  <span>{item.label}</span>
                )}
                {!isLast && (
                  <span aria-hidden="true" className="text-muted-foreground/50">
                    /
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
