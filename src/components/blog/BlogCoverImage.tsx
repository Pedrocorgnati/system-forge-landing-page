'use client'

/**
 * components/blog/BlogCoverImage.tsx
 * Wrapper client de next/image para capas de blog com fallback robusto:
 * - se a imagem original falhar, troca para um cover neutro deterministico por slug;
 * - se o cover neutro tambem falhar, cai para o default-cover.png;
 * - sem flash apos primeiro paint, sem loop infinito.
 */

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getCoverFallback,
  LAST_RESORT_COVER,
} from '@/lib/blog/cover-fallback'

interface BlogCoverImageProps {
  src: string | undefined
  alt: string
  slug: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
}

type Stage = 'original' | 'fallback' | 'last-resort'

export function BlogCoverImage({
  src,
  alt,
  slug,
  fill,
  width,
  height,
  sizes,
  priority = false,
  className,
}: BlogCoverImageProps) {
  const original = src || getCoverFallback(slug)
  const [stage, setStage] = useState<Stage>('original')

  const currentSrc =
    stage === 'original'
      ? original
      : stage === 'fallback'
        ? getCoverFallback(slug)
        : LAST_RESORT_COVER

  const handleError = () => {
    if (stage === 'original') setStage('fallback')
    else if (stage === 'fallback') setStage('last-resort')
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={handleError}
      className={cn('object-cover', className)}
    />
  )
}
