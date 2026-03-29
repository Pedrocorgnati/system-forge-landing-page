'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { buildWhatsAppCTA } from '@/lib/cta'
import { CTAButton } from '@/components/ui/CTAButton'

const projects = [
  {
    name: 'ServiziPerCasa',
    category: 'Marketplace Italiano',
    description: 'Italian marketplace connecting homeowners with domestic service professionals. Booking, Stripe payments, and analytics dashboard.',
    tags: ['Next.js', 'Prisma', 'Stripe'],
    videoUrl: '/video/servizipercasa.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Piemontech',
    category: 'SaaS + IA para PMEs',
    description: 'B2B platform with automated landing page builder, AI diagnostics, prospecting engine, and affiliate system.',
    tags: ['Next.js', 'Claude AI', 'Stripe'],
    videoUrl: '/video/piemontech.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Sistema Garantido',
    category: 'SaaS + IA de Garantias',
    description: 'Warranty management with 2FA, Stripe billing, Claude AI, and full lifecycle tracking via Twilio.',
    tags: ['Next.js', 'Claude AI', 'Twilio'],
    videoUrl: '/video/sistema-garantido.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'BicoJá',
    category: 'Marketplace de Serviços',
    description: 'On-demand services marketplace with web + React Native app, virtual currency, premium subscriptions.',
    tags: ['Next.js', 'React Native', 'Prisma'],
    videoUrl: '/video/bicoja.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Stork Logistics',
    category: 'Plataforma Logística',
    description: 'End-to-end logistics with real-time tracking, Recharts analytics, event-driven automation via Inngest.',
    tags: ['Next.js', 'Recharts', 'Inngest'],
    videoUrl: '/video/stork-logistics.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Divulga Fácil Dashboard',
    category: 'SaaS · Telegram Bots',
    description: 'SaaS dashboard powering 4 Telegram bots with Kiwify webhooks, usage limits, and real-time analytics.',
    tags: ['Next.js', 'PostgreSQL', 'Stripe'],
    videoUrl: '/video/divulga-facil-dashboard.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'QuackCoin Platform',
    category: 'Plataforma Crypto',
    description: 'Full-stack crypto ecosystem with 2FA, daily rewards, USDC staking, education CMS, and affiliate cashback.',
    tags: ['Next.js', 'Prisma', 'Go'],
    videoUrl: '/video/Quackcoin.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Abitare Holding',
    category: 'Site Institucional',
    description: 'Corporate website for Italian real estate holding with smooth animations, video backgrounds, and conversion focus.',
    tags: ['Astro', 'Tailwind CSS'],
    videoUrl: '/video/abitare-holding.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Health Technologies',
    category: 'Site Institucional · IA na Saúde',
    description: 'Healthcare AI company site showcasing surgical robotics, diagnostics, and smart pharmacy solutions.',
    tags: ['Next.js', 'TypeScript'],
    videoUrl: '/video/HealthTechnologies.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'SiteBaratoBR',
    category: 'Website Builder',
    description: 'Platform where users design custom sites and receive full source code — single payment, no subscriptions.',
    tags: ['Next.js', 'Stripe', 'AWS S3'],
    videoUrl: '/video/site-barato.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Dove Abitare Bene',
    category: 'Blog Editorial',
    description: 'Italian lifestyle blog with blazing-fast Astro performance, Pagefind search, and Giscus comments.',
    tags: ['Astro', 'Pagefind'],
    videoUrl: '/video/doveabitarebene.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Calculadora Motoristas',
    category: 'Ferramenta Web',
    description: 'Smart cost calculator for ride-share drivers with interactive charts and real-time profitability insights.',
    tags: ['Next.js', 'Recharts'],
    videoUrl: '/video/calculadora-motoristas.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Thamy Shoes',
    category: 'Sistema Industrial',
    description: 'Production management for shoe factory integrating Bling ERP with auto-import and PDF generation.',
    tags: ['Next.js', 'Prisma', 'Bling API'],
    videoUrl: '/video/thamy-shoes.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Design System Showroom',
    category: 'Ferramenta Dev',
    description: 'Interactive design system preview with real-time theme composition, WCAG validation, and token export.',
    tags: ['Next.js', 'Zustand'],
    videoUrl: '/video/showroom.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Corgnati Platform',
    category: 'SaaS Completo',
    description: 'Full-featured platform with CRM, project management, invoicing, and client dashboard.',
    tags: ['Next.js', 'Prisma', 'Stripe'],
    videoUrl: '/video/corgnati-platform.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'TechSkillsThatPay',
    category: 'Blog Multi-idioma',
    description: 'Tech education blog in EN, PT-BR, ES, IT with MDX content, SEO hreflang, sitemaps, and RSS.',
    tags: ['Next.js', 'MDX'],
    videoUrl: '/video/techskillsthatpay.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'ApexCrypto',
    category: 'Website Crypto',
    description: 'Conversion-focused landing page for crypto education platform with bold visuals and video hero.',
    tags: ['Next.js', 'Sass'],
    videoUrl: '/video/Apexcrypto-website.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'ApexSwift Dashboard',
    category: 'Dashboard Financeiro',
    description: 'Data-heavy finance dashboard with interactive charts, user management, and scalable interface.',
    tags: ['Next.js', 'Go', 'Tailwind'],
    videoUrl: '/video/ApexSwift-dashboard.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'ScoreTube Landing',
    category: 'Landing Page IA',
    description: 'AI-powered platform landing page for YouTube video evaluation, designed for conversion.',
    tags: ['Next.js', 'Tailwind CSS'],
    videoUrl: '/video/Scoretube-landing.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'NineKeys',
    category: 'Landing Page Premium',
    description: 'Property management landing page with crisp typography, immersive video sections, and smooth flow.',
    tags: ['HTML', 'CSS', 'TypeScript'],
    videoUrl: '/video/Ninekeys.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'QuackCoin Landing',
    category: 'Landing Page Crypto',
    description: 'High-conversion page for utility token ecosystem with tokenomics breakdown and waitlist signup.',
    tags: ['HTML', 'CSS', 'TypeScript'],
    videoUrl: '/video/quack-coin-landing-page.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'C4ts',
    category: 'Knowledge Base IA',
    description: 'AI-first knowledge base with problem-oriented guidance across 15 frontend domains.',
    tags: ['Markdown', 'TypeScript', 'AI'],
    videoUrl: '/video/c4ts.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'SuppleSeller',
    category: 'E-commerce',
    description: 'Complete e-commerce for sports nutrition with storefront, admin dashboard, and smooth shopping flows.',
    tags: ['Next.js', 'Go'],
    videoUrl: '/video/Suppleseller.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Passkey Dashboard',
    category: 'Dashboard Marketing',
    description: 'Campaign management dashboard with workspaces, creative assets, and advanced filtering.',
    tags: ['Next.js', 'TypeScript', 'Sass'],
    videoUrl: '/video/Passkey-dashboard.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'ZenMinder',
    category: 'Plataforma Produtividade',
    description: 'Productivity platform with auth, reminders, phone verification, rewards marketplace.',
    tags: ['React', 'Firebase', 'Sass'],
    videoUrl: '/video/Zenminder.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Personal Website',
    category: 'Portfolio Pessoal',
    description: 'Interactive developer portfolio with animated sections, project showcase, and contact form.',
    tags: ['Next.js', 'Bootstrap'],
    videoUrl: '/video/Personal-Resume-Website.mp4',
    href: ROUTES.PORTFOLIO,
  },
  {
    name: 'Cognuscraft',
    category: 'Landing Page IA',
    description: 'Brand-focused landing page for AI company, highlighting mission and flagship products.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    videoUrl: '/video/Cognuscraft.mp4',
    href: ROUTES.PORTFOLIO,
  },
]

function ProjectCard({
  project,
}: {
  project: (typeof projects)[number]
}) {
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
      aria-label={`Projeto ${project.name} — ${project.category}`}
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
            Ver projeto →
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

  const cta = buildWhatsAppCTA('Agendar conversa', 'portfólio de projetos')

  return (
    <section
      id="portfolio"
      data-testid="section-portfolio"
      aria-label="Portfólio de projetos"
      className="w-full bg-background py-20 md:py-28"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-[28px] sm:text-[36px] font-semibold text-foreground leading-tight tracking-tight">
                Projetos que entregamos
              </h2>
              <p className="text-muted-foreground text-sm">
                {projects.length} projetos reais — de MVPs a plataformas escaláveis
              </p>
            </div>
            <Link
              href={ROUTES.PORTFOLIO}
              data-testid="portfolio-view-all-link"
              className="text-sm font-medium text-primary hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
            >
              Ver portfólio completo →
            </Link>
          </div>

          {/* Carousel */}
          <div className="portfolio-carousel__wrapper">
            {/* Prev arrow */}
            <button
              onClick={prev}
              disabled={currentPage === 0}
              className="portfolio-carousel__arrow portfolio-carousel__arrow--prev"
              aria-label="Projetos anteriores"
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
              aria-label="Próximos projetos"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Dots */}
          <div className="portfolio-carousel__dots" role="tablist" aria-label="Navegação do carrossel">
            {Array.from({ length: PAGE_COUNT }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === currentPage}
                onClick={() => scrollToPage(i)}
                className={`portfolio-carousel__dot${i === currentPage ? ' is-active' : ''}`}
                aria-label={`Página ${i + 1} de ${PAGE_COUNT}`}
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
