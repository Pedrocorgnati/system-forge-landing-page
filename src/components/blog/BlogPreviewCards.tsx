'use client'

/**
 * components/blog/BlogPreviewCards.tsx
 * Client component: gerencia Intersection Observer para stagger reveal.
 * BlogPreview (Server) passa os artigos; este componente renderiza o grid.
 */
import { useEffect, useRef } from 'react'
import { ArticleCard } from './ArticleCard'
import type { ArticleFrontmatter } from '@/lib/types'

interface BlogPreviewCardsProps {
  articles: ArticleFrontmatter[]
}

export function BlogPreviewCards({ articles }: BlogPreviewCardsProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const cards = grid.querySelectorAll<HTMLElement>('[data-blog-reveal]')

    // Se prefers-reduced-motion, marca tudo como visível sem animação
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach((card) => card.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <div data-testid="blog-preview-grid" ref={gridRef} className="blog-grid">
      {articles.map((article, index) => (
        <ArticleCard
          key={article.slug}
          article={article}
          variant={index === 0 ? 'featured' : 'default'}
          index={index}
        />
      ))}
    </div>
  )
}
