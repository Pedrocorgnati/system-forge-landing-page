import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  loading?: 'lazy' | 'eager'
  className?: string
  sizes?: string
  fill?: boolean
}

// RESOLVED: loading="lazy" por padrão para imagens abaixo do fold
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  loading = 'lazy',
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
      loading={priority ? undefined : loading}
      sizes={sizes}
      className={cn('object-cover', className)}
    />
  )
}
