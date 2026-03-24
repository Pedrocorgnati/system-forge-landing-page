import { cn } from '@/lib/utils'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

export function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
