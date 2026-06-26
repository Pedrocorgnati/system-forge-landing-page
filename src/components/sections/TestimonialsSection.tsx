'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Quote, Pause, Play } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionCTA } from '@/components/ui/SectionCTA'
import { testimonials } from '@/lib/data'
import { cn } from '@/lib/utils'
import { loadMessages } from '@config/content'
import { TIMING } from '@/lib/constants/timing'

const messages = loadMessages()

// RESOLVED: StarRating array criado fora do componente para evitar alocação por render
const STAR_INDICES = [0, 1, 2, 3, 4]

function StarRating({ animate = false }: { animate?: boolean }) {
  return (
    <div className="flex gap-0.5" aria-label={messages.sections.testimonials.ratingLabel} role="img">
      {STAR_INDICES.map((i) => (
        <svg
          key={i}
          data-star-index={animate ? i : undefined}
          className={cn(
            'w-4 h-4 text-warning fill-current',
            animate && 'star-animate',
          )}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ name, avatarUrl, isActive = false }: { name: string; avatarUrl?: string; isActive?: boolean }) {
  const ringClass = isActive ? 'avatar-ring-active' : ''

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={40}
        height={40}
        className={cn('w-10 h-10 rounded-full object-cover shrink-0 transition-shadow duration-300', ringClass)}
      />
    )
  }

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
        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 transition-shadow duration-300',
        colors[colorIndex],
        ringClass,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export function TestimonialsSection() {
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const total = testimonials.length

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % total) + total) % total)
    },
    [total],
  )

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!isPaused) {
      timerRef.current = setTimeout(() => goTo(active + 1), TIMING.CAROUSEL_AUTOPLAY)
    }
  }, [active, goTo, isPaused])

  useEffect(() => {
    // Respect prefers-reduced-motion: start paused
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPaused(true)
      return
    }
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  // Staggered grid reveal via IO
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      grid.querySelectorAll('.testimonial-reveal').forEach((el) => el.classList.add('is-visible'))
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )

    grid.querySelectorAll('.testimonial-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handlePrev = () => {
    goTo(active - 1)
    resetTimer()
  }

  const handleNext = () => {
    goTo(active + 1)
    resetTimer()
  }

  const current = testimonials[active]
  if (!current) return null

  return (
    <section
      data-testid="section-testimonials"
      aria-label={messages.sections.testimonials.ariaLabel}
      className="section-testimonials relative w-full bg-surface py-20 md:py-28"
    >
      <Container>
        <div className="flex flex-col gap-12">
          {/* Header — MC-2: pill badge + MC-6: refined typography */}
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-primary w-fit">
              {messages.sections.testimonials.eyebrow}
            </span>
            <h2
              className="font-extrabold text-foreground leading-[1.15] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
            >
              {messages.sections.testimonials.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {messages.sections.testimonials.subtitle}
            </p>
          </div>

          {/* Carousel — MC-3: quote mark + MC-4: cross-fade + MC-6: avatar ring */}
          <div className="relative">
            <div
              id="testimonial-panel"
              key={active}
              data-testid="testimonial-card-active"
              className="testimonial-active-card relative flex flex-col gap-6 p-8 md:p-10 rounded-2xl border border-border bg-card overflow-hidden min-h-[320px] md:min-h-[280px]"
              role="tabpanel"
              aria-label={`${messages.sections.testimonials.eyebrow} — ${current.author}`}
              aria-live="polite"
              tabIndex={0}
            >
              {/* MC-3: Oversized gradient quote mark */}
              <Quote
                size={80}
                className="absolute top-4 left-6 text-primary/[0.07] pointer-events-none"
                aria-hidden="true"
                strokeWidth={1}
              />

              <div className="relative z-10 flex flex-col gap-6">
                <StarRating animate />

                <blockquote className="text-lg md:text-xl text-foreground leading-relaxed font-medium italic">
                  &ldquo;{current.content}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <Avatar name={current.author} avatarUrl={current.avatarUrl} isActive />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{current.author}</h3>
                    <p className="text-xs text-muted-foreground">
                      {current.role} · {current.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              {/* Dots */}
              <div className="flex gap-2" role="tablist" aria-label={messages.sections.testimonials.ariaLabel}>
                {testimonials.map((t, i) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={i === active}
                    aria-controls="testimonial-panel"
                    aria-label={`${messages.sections.testimonials.eyebrow} — ${t.author}`}
                    onClick={() => {
                      goTo(i)
                      resetTimer()
                    }}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                      i === active ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                    )}
                  />
                ))}
              </div>

              {/* Prev/Next + Pause */}
              <div className="flex gap-2">
                <button
                  data-testid="testimonial-prev-button"
                  onClick={handlePrev}
                  aria-label={messages.sections.testimonials.prevLabel}
                  className={cn(
                    'w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center',
                    'hover:border-primary/40 hover:bg-accent hover:-translate-y-0.5 transition-all duration-200',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  )}
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" aria-hidden="true" />
                </button>
                <button
                  data-testid="testimonial-pause-button"
                  onClick={() => setIsPaused((p) => !p)}
                  aria-label={isPaused
                    ? messages.sections.testimonials.resumeLabel
                    : messages.sections.testimonials.pauseLabel}
                  aria-pressed={isPaused}
                  className={cn(
                    'w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center',
                    'hover:border-primary/40 hover:bg-accent hover:-translate-y-0.5 transition-all duration-200',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  )}
                >
                  {isPaused
                    ? <Play className="w-4 h-4 text-foreground" aria-hidden="true" />
                    : <Pause className="w-4 h-4 text-foreground" aria-hidden="true" />}
                </button>
                <button
                  data-testid="testimonial-next-button"
                  onClick={handleNext}
                  aria-label={messages.sections.testimonials.nextLabel}
                  className={cn(
                    'w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center',
                    'hover:border-primary/40 hover:bg-accent hover:-translate-y-0.5 transition-all duration-200',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  )}
                >
                  <ChevronRight className="w-4 h-4 text-foreground" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid — MC-5: glassmorphic cards + MC-7: stagger reveal + MC-6: avatar ring */}
          <div ref={gridRef} className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={cn(
                  'testimonial-reveal testimonial-card group relative flex flex-col gap-4 p-6 rounded-xl border bg-card cursor-pointer overflow-hidden',
                  `tst-delay-${i}`,
                  i === active
                    ? 'border-primary/30 testimonial-card-active'
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
                {/* Subtle quote mark per card */}
                <Quote
                  size={48}
                  className="absolute top-3 right-3 text-primary/[0.05] pointer-events-none"
                  aria-hidden="true"
                  strokeWidth={1}
                />

                <div className="relative z-10 flex flex-col gap-4">
                  <StarRating />
                  <p className="text-sm text-foreground leading-relaxed line-clamp-3 italic">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <Avatar name={t.author} avatarUrl={t.avatarUrl} isActive={i === active} />
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{t.author}</h3>
                      <p className="text-xs text-muted-foreground">
                        {t.role} · {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Conversao: prova social -> acao primaria (locale-aware) */}
          <SectionCTA context="testimonials" className="mt-12" />
        </div>
      </Container>
    </section>
  )
}
