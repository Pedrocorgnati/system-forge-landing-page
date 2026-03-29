'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { buildWhatsAppCTA } from '@/lib/cta'
import { CTAButton } from '@/components/ui/CTAButton'
import { portfolioProjects } from '@/lib/data'
import { loadMessages } from '@config/content'

const messages = loadMessages()

/** Maps ServiceCategory enum values to universal display labels */
const CATEGORY_DISPLAY: Record<string, string> = {
  'saas': 'SaaS',
  'aplicativo-mobile': 'Mobile',
  'marketplace': 'Marketplace',
  'automacao-com-ia': 'AI',
  'bots-automacoes': 'Bots',
  'landing-page': 'Landing Page',
  'e-commerce': 'E-commerce',
  'dashboard-b2b': 'Dashboard',
  'api-integracoes': 'API',
  'desktop': 'Desktop',
  'gestao-setorial': 'ERP / Mgmt',
  'erp': 'ERP',
  'consultoria': 'Consultoria',
}

/** Display-ready tech tag capitalizations */
function formatTag(tag: string): string {
  const caps: Record<string, string> = {
    'next.js': 'Next.js',
    'react': 'React',
    'typescript': 'TypeScript',
    'node.js': 'Node.js',
    'python': 'Python',
    'supabase': 'Supabase',
    'tailwind': 'Tailwind',
    'prisma': 'Prisma',
    'react-native': 'React Native',
    'stripe': 'Stripe',
    'claude': 'Claude AI',
    'chart.js': 'Chart.js',
    'recharts': 'Recharts',
    'twilio': 'Twilio',
    'inngest': 'Inngest',
    'go': 'Go',
    'html/css': 'HTML/CSS',
    'astro': 'Astro',
    'mdx': 'MDX',
    'aws s3': 'AWS S3',
    'firebase': 'Firebase',
    'zustand': 'Zustand',
    'postgresql': 'PostgreSQL',
  }
  return caps[tag] ?? tag
}

type Project = {
  name: string
  category: string
  description: string
  tags: string[]
  videoUrl: string
  href: string
}

const projects: Project[] = portfolioProjects
  .filter(p => Boolean(p.videoUrl))
  .map(p => ({
    name: p.name ?? p.slug,
    category: CATEGORY_DISPLAY[p.categories[0] ?? ''] ?? (p.categories[0] ?? ''),
    description: p.description,
    tags: (p.technologies ?? []).slice(0, 3).map(formatTag),
    videoUrl: p.videoUrl as string,
    href: ROUTES.PORTFOLIO,
  }))

function ProjectCard({ project }: { project: Project }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play()
    setIsPlaying(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsPlaying(false)
  }, [])

  return (
    <article
      aria-label={`${project.name} — ${project.category}`}
      className="portfolio-carousel__card group relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden="true"
      >
        <source src={project.videoUrl} type="video/mp4" />
      </video>

      {/* Overlay escuro fixo */}
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

      {/* Play icon — visível enquanto parado, some no hover */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 md:opacity-100 md:group-hover:opacity-0"
          aria-hidden="true"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm ring-1 ring-white/20">
            <svg
              viewBox="0 0 24 24"
              fill="white"
              className="h-5 w-5 translate-x-0.5"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Overlay info — mobile: sempre visível; desktop: aparece no hover */}
      <div
        className={[
          'absolute inset-0 flex items-end',
          'bg-gradient-to-t from-black/90 via-black/40 to-transparent',
          'transition-all duration-300 ease-out',
          'opacity-100 translate-y-0',
          'md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0',
        ].join(' ')}
        aria-hidden="true"
      >
        <div className="w-full p-5">
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium">
            {project.category}
          </p>
          <h3 className="mt-1.5 text-base font-semibold text-white leading-snug">
            {project.name}
          </h3>
          <p className="mt-1.5 text-[11px] text-white/70 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href={project.href}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-white transition-colors"
            tabIndex={0}
          >
            {messages.cta.portfolio} →
          </Link>
        </div>
      </div>
    </article>
  )
}

const CARDS_PER_VIEW = 3
const PAGE_COUNT = Math.ceil(projects.length / CARDS_PER_VIEW)

export function PortfolioBento() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const scrollToPage = useCallback((page: number) => {
    const track = trackRef.current
    if (!track) return
    const targetIndex = page * CARDS_PER_VIEW
    const slide = track.children[targetIndex] as HTMLElement
    if (!slide) return
    track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' })
    setCurrentPage(page)
  }, [])

  const prev = useCallback(() => {
    scrollToPage(Math.max(0, currentPage - 1))
  }, [currentPage, scrollToPage])

  const next = useCallback(() => {
    scrollToPage(Math.min(PAGE_COUNT - 1, currentPage + 1))
  }, [currentPage, scrollToPage])

  // Sync page indicator on manual scroll
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const handler = () => {
      const slideWidth = (track.children[0] as HTMLElement)?.offsetWidth ?? 0
      if (slideWidth <= 0) return
      const cardIndex = Math.round(track.scrollLeft / (slideWidth + 24))
      setCurrentPage(Math.floor(cardIndex / CARDS_PER_VIEW))
    }
    track.addEventListener('scroll', handler, { passive: true })
    return () => track.removeEventListener('scroll', handler)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  const cta = buildWhatsAppCTA(messages.cta.calendly, messages.sections.portfolio.label)

  return (
    <section
      id="portfolio"
      data-testid="section-portfolio"
      aria-label={messages.sections.portfolio.ariaLabel}
      className="w-full bg-background py-20 md:py-28"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] sm:text-[36px] font-semibold text-foreground leading-tight tracking-tight">
                {messages.sections.portfolio.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {projects.length} {messages.sections.portfolio.countSuffix}
              </p>
            </div>
            <Link
              href={ROUTES.PORTFOLIO}
              data-testid="portfolio-view-all-link"
              className="text-sm font-medium text-primary hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
            >
              {messages.cta.portfolio} →
            </Link>
          </div>

          {/* Carousel */}
          <div className="portfolio-carousel__wrapper">
            {/* Prev arrow */}
            <button
              onClick={prev}
              disabled={currentPage === 0}
              className="portfolio-carousel__arrow portfolio-carousel__arrow--prev"
              aria-label={messages.cta.viewAllProjects}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Viewport */}
            <div className="portfolio-carousel__viewport">
              <div ref={trackRef} className="portfolio-carousel__track">
                {projects.map((project) => (
                  <div key={project.name} className="portfolio-carousel__slide">
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            </div>

            {/* Next arrow */}
            <button
              onClick={next}
              disabled={currentPage >= PAGE_COUNT - 1}
              className="portfolio-carousel__arrow portfolio-carousel__arrow--next"
              aria-label={messages.cta.viewAllProjects}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Dots */}
          <div className="portfolio-carousel__dots" role="tablist" aria-label={messages.sections.portfolio.ariaLabel}>
            {Array.from({ length: PAGE_COUNT }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === currentPage}
                onClick={() => scrollToPage(i)}
                className={`portfolio-carousel__dot${i === currentPage ? ' is-active' : ''}`}
                aria-label={`${i + 1} / ${PAGE_COUNT}`}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-4">
            <CTAButton config={cta} size="lg" variant="primary" />
          </div>
        </div>
      </Container>
    </section>
  )
}
