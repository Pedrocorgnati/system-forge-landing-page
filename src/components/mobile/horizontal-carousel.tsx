'use client'

import { cn } from '@/lib/utils'

interface HorizontalCarouselProps {
  children: React.ReactNode
  className?: string
  gap?: 'sm' | 'md' | 'lg'
}

export function HorizontalCarousel({
  children,
  className,
  gap = 'md',
}: HorizontalCarouselProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  return (
    <div
      data-testid="horizontal-carousel"
      className={cn(
        'flex overflow-x-auto scroll-smooth snap-x snap-mandatory',
        'pb-4 -mb-4 px-4 -mx-4',
        gapClasses[gap],
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CarouselItemProps {
  children: React.ReactNode
  className?: string
  width?: string
}

export function CarouselItem({
  children,
  className,
  width = 'w-[85vw] sm:w-[70vw] md:w-auto',
}: CarouselItemProps) {
  return (
    <div
      className={cn('snap-start shrink-0', width, className)}
    >
      {children}
    </div>
  )
}
