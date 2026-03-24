'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { testimonials } from '@/lib/data'
import { cn } from '@/lib/utils'

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 estrelas" role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-warning fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const colors = [
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-emerald-500',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length

  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
        colors[colorIndex],
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export function TestimonialsSection() {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = testimonials.length

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % total) + total) % total)
    },
    [total],
  )

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => goTo(active + 1), 5000)
  }, [active, goTo])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  const handlePrev = () => {
    goTo(active - 1)
    resetTimer()
  }

  const handleNext = () => {
    goTo(active + 1)
    resetTimer()
  }

  const current = testimonials[active]

  return (
    <section
      data-testid="section-testimonials"
      aria-label="Depoimentos de clientes"
      className="w-full bg-surface py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Depoimentos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              O que nossos clientes dizem
            </h2>
          </div>

          {/* Carousel */}
          <div className="relative">
            {/* Main testimonial */}
            <div
              key={active}
              data-testid="testimonial-card-active"
              className="animate-fade-in flex flex-col gap-6 p-8 rounded-2xl border border-border bg-card"
              role="article"
              aria-label={`Depoimento de ${current.author}`}
            >
              <StarRating />
              <blockquote className="text-lg text-foreground leading-relaxed">
                &ldquo;{current.content}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <AvatarInitials name={current.author} />
                <div>
                  <p className="font-semibold text-foreground text-sm">{current.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {current.role} · {current.company}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              {/* Dots */}
              <div className="flex gap-2" role="tablist" aria-label="Navegar entre depoimentos">
                {testimonials.map((t, i) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={i === active}
                    aria-label={`Depoimento de ${t.author}`}
                    onClick={() => {
                      goTo(i)
                      resetTimer()
                    }}
                    className={cn(
                      'h-2 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                      i === active ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                    )}
                  />
                ))}
              </div>

              {/* Prev/Next */}
              <div className="flex gap-2">
                <button
                  data-testid="testimonial-prev-button"
                  onClick={handlePrev}
                  aria-label="Depoimento anterior"
                  className={cn(
                    'w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center',
                    'hover:border-primary/40 hover:bg-accent transition-all duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  )}
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" aria-hidden="true" />
                </button>
                <button
                  data-testid="testimonial-next-button"
                  onClick={handleNext}
                  aria-label="Próximo depoimento"
                  className={cn(
                    'w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center',
                    'hover:border-primary/40 hover:bg-accent transition-all duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  )}
                >
                  <ChevronRight className="w-4 h-4 text-foreground" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* All testimonials grid — visible on larger screens */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={cn(
                  'flex flex-col gap-4 p-6 rounded-xl border bg-card transition-all duration-200 cursor-pointer',
                  i === active
                    ? 'border-primary/40 shadow-md'
                    : 'border-border hover:border-primary/20',
                )}
                onClick={() => {
                  goTo(i)
                  resetTimer()
                }}
                role="button"
                tabIndex={0}
                aria-pressed={i === active}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    goTo(i)
                    resetTimer()
                  }
                }}
              >
                <StarRating />
                <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <AvatarInitials name={t.author} />
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
