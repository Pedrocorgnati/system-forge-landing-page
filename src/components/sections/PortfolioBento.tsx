'use client'

import { useRef, useCallback } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Container } from '@/components/ui/Container'
import { buildWhatsAppCTA } from '@/lib/cta'
import { CTAButton } from '@/components/ui/CTAButton'

const projects = [
  {
    name: 'ServiziPerCasa',
    category: 'Marketplace Italiano',
    videoUrl: '/video/servizipercasa.mp4',
    href: ROUTES.PORTFOLIO,
    aria: 'Projeto ServiziPerCasa — marketplace italiano de serviços domésticos',
    hero: true,
  },
  {
    name: 'Sistema Garantido',
    category: 'SaaS + IA de Garantias',
    videoUrl: '/video/sistema-garantido.mp4',
    href: ROUTES.PORTFOLIO,
    aria: 'Projeto Sistema Garantido — gestão de garantias com IA',
    hero: false,
  },
  {
    name: 'Piemontech',
    category: 'SaaS + IA para PMEs',
    videoUrl: '/video/piemontech.mp4',
    href: ROUTES.PORTFOLIO,
    aria: 'Projeto Piemontech — plataforma B2B SaaS com IA',
    hero: false,
  },
  {
    name: 'Abitare Holding',
    category: 'Site Institucional',
    videoUrl: '/video/abitare-holding.mp4',
    href: ROUTES.PORTFOLIO,
    aria: 'Projeto Abitare Holding — site institucional para holding imobiliária italiana',
    hero: false,
  },
  {
    name: 'Health Technologies',
    category: 'Site Institucional · IA na Saúde',
    videoUrl: '/video/HealthTechnologies.mp4',
    href: ROUTES.PORTFOLIO,
    aria: 'Projeto Health Technologies — site institucional para empresa de IA na saúde com robótica cirúrgica e diagnósticos',
    hero: false,
  },
  {
    name: 'QuackCoin',
    category: 'Plataforma Crypto',
    videoUrl: '/video/Quackcoin.mp4',
    href: ROUTES.PORTFOLIO,
    aria: 'Projeto QuackCoin — ecossistema de token utilitário',
    hero: false,
  },
]

function BentoCard({
  project,
}: {
  project: (typeof projects)[number]
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = useCallback(() => {
    videoRef.current?.play()
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [])

  return (
    <article
      aria-label={project.aria}
      className={[
        'group relative overflow-hidden rounded-2xl border border-border bg-card',
        'shadow-lg cursor-pointer',
        project.hero ? 'md:col-span-2 md:row-span-2' : '',
      ].join(' ')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Vídeo — parado por padrão, toca no hover */}
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

      {/* Overlay escuro fixo (base) */}
      <div className="absolute inset-0 bg-black/10" aria-hidden="true" />

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
        <div className="w-full p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium">
            {project.category}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-white">
            {project.name}
          </h3>
          <Link
            href={project.href}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-white transition-colors"
            tabIndex={0}
          >
            Ver projeto →
          </Link>
        </div>
      </div>
    </article>
  )
}

export function PortfolioBento() {
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
            <div className="flex items-center gap-4">
              <h2 className="text-[28px] sm:text-[36px] font-semibold text-foreground leading-tight tracking-tight">
                Projetos que entregamos
              </h2>
            </div>
            <Link
              href={ROUTES.PORTFOLIO}
              data-testid="portfolio-view-all-link"
              className="text-sm font-medium text-primary hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
            >
              Ver portfólio completo →
            </Link>
          </div>

          {/* Bento grid */}
          <div
            data-testid="portfolio-bento"
            className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[220px]"
          >
            {projects.map((project) => (
              <BentoCard key={project.name} project={project} />
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
