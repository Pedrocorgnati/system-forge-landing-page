import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  sizes?: string
  fill?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes,
  fill,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={cn('object-cover', className)}
    />
  )
}
