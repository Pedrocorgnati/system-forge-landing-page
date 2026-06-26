'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/ui/Container'
import { services } from '@/lib/data'
import type { ServiceFilterGroup } from '@/lib/types'
import Link from 'next/link'
import { ChevronRight, ChevronDown, Check, Clock } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { getSiteConfig } from '@config'
import { loadMessages, loadPageMessages } from '@config/content'

const config = getSiteConfig()
const messages = loadMessages()
const pageMessages = loadPageMessages()

// ── h2 text split into words for word-reveal animation ──
const H2_WORDS = pageMessages.services.titulo_secao.split(' ')

// ── Filter pill config — locale-aware ──
const locale = config.locale
const FILTER_PILLS: { label: string; value: 'all' | ServiceFilterGroup }[] = [
  {
    label: locale === 'it-IT' ? 'Tutti' : locale === 'en' ? 'All' : locale === 'es-ES' ? 'Todos' : 'Todos',
    value: 'all',
  },
  {
    label: locale === 'it-IT' ? 'Prodotto Digitale' : locale === 'en' ? 'Digital Product' : locale === 'es-ES' ? 'Producto Digital' : 'Produto Digital',
    value: 'produto',
  },
  {
    label: locale === 'it-IT' ? 'Mobile & IA' : locale === 'en' ? 'Mobile & AI' : locale === 'es-ES' ? 'Mobile & IA' : 'Mobile & IA',
    value: 'mobile-ia',
  },
  {
    label: locale === 'it-IT' ? 'Dati & API' : locale === 'en' ? 'Data & APIs' : locale === 'es-ES' ? 'Datos & APIs' : 'Dados & APIs',
    value: 'dados',
  },
]

export function ServicesGrid() {
  const [activeId, setActiveId]           = useState(services[0]?.slug ?? '')
  const [filterGroup, setFilterGroup]     = useState<'all' | ServiceFilterGroup>('all')
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null)

  const { ref: sectionRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 })

  // Filtered list for the desktop selector
  const visibleServices = filterGroup === 'all'
    ? services
    : services.filter((s) => s.filterGroup === filterGroup)

  const activeService = (
    visibleServices.find((s) => s.slug === activeId)
    ?? visibleServices[0]
    ?? services[0]
  )!

  // When filter changes, reset activeId to the first visible service
  useEffect(() => {
    const first = filterGroup === 'all'
      ? services[0]
      : services.find((s) => s.filterGroup === filterGroup)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional derived state reset on filter change
    if (first) setActiveId(first.slug)
  }, [filterGroup])

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      id="servicos"
      data-testid="section-services"
      aria-label={messages.sections.services.ariaLabel}
      className="section-services relative w-full overflow-hidden bg-background py-20 md:py-28"
    >
      {/* MC-7: Ambient glow background */}
      <div className="svc-ambient-bg" aria-hidden="true" />

      <Container className="relative z-10">
        <div className="flex flex-col gap-10">

          {/* ── Header ── */}
          <div className={`flex flex-col gap-4 max-w-2xl ${hasIntersected ? 'svc-stagger-1' : 'opacity-0'}`}>
            {/* Eyebrow row with count badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                  {messages.sections.services.eyebrow}
                </span>
              </div>
              {/* MC-2: Count badge */}
              <span className="svc-count-badge" aria-label={messages.sections.services.badge}>
                {messages.sections.services.badge}
              </span>
            </div>

            {/* MC-1: Word-reveal h2 */}
            <h2
              className={`font-semibold text-foreground leading-tight ${hasIntersected ? 'svc-word-revealed' : ''}`}
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
              aria-label={pageMessages.services.titulo_secao}
            >
              {H2_WORDS.map((word, i) => (
                <span key={i} className={`svc-word svc-word-${i + 1}`} aria-hidden="true">
                  {word}{i < H2_WORDS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              {pageMessages.services.subtitulo}
            </p>
          </div>

          {/* MC-3: Category filter pills */}
          <div
            className={`svc-filter-bar ${hasIntersected ? 'svc-stagger-2' : 'opacity-0'}`}
            role="group"
            aria-label={locale === 'it-IT' ? 'Filtra per categoria' : locale === 'en' ? 'Filter by category' : locale === 'es-ES' ? 'Filtrar por categoría' : 'Filtrar por categoria'}
          >
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setFilterGroup(pill.value)}
                className={`svc-filter-pill ${filterGroup === pill.value ? 'svc-filter-pill-active' : ''}`}
                aria-pressed={filterGroup === pill.value}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Split layout: cards + detail panel */}
          <div className={`hidden lg:grid grid-cols-[1fr_360px] gap-8 ${hasIntersected ? 'svc-stagger-3' : 'opacity-0'}`}>

            {/* Left: card list — 2 columns */}
            <div className="grid grid-cols-2 gap-3 auto-rows-min">
              {visibleServices.map((service, index) => {
                const isActive  = service.slug === activeId
                const staggerN  = Math.min(index + 1, 4)
                const staggerCl = hasIntersected ? `svc-stagger-${staggerN}` : 'opacity-0'

                return (
                  <button
                    key={service.slug}
                    type="button"
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setActiveId(service.slug)}
                    onMouseEnter={() => setActiveId(service.slug)}
                    onFocus={() => setActiveId(service.slug)}
                    className={`svc-card ${staggerCl} group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
                      isActive
                        ? 'border-primary/30 bg-card'
                        : 'border-border bg-card/50 hover:border-primary/20'
                    }`}
                  >
                    {/* Active indicator line */}
                    <div
                      className={`absolute left-0 top-3 bottom-3 rounded-r-full transition-all duration-300 ${
                        isActive ? 'w-1 svc-active-line' : 'w-0.5 bg-border'
                      }`}
                      aria-hidden="true"
                    />

                    {/* Content */}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-all duration-300 ${
                            isActive
                              ? 'bg-primary/15 svc-icon-glow'
                              : 'bg-muted group-hover:bg-primary/10'
                          }`}
                        >
                          <span role="img" aria-label={service.name}>{service.icon}</span>
                        </div>
                        <h3 className={`text-sm font-semibold leading-snug transition-colors duration-200 ${
                          isActive ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
                        }`}>
                          {service.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right: detail panel (sticky) */}
            <div>
              <div className="sticky top-24">
                <div
                  key={activeService.slug}
                  className="svc-panel-content rounded-2xl border border-border bg-card p-7"
                  aria-live="polite"
                >
                  {/* Icon + title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 svc-icon-glow text-2xl shrink-0">
                      <span role="img" aria-label={activeService.name}>{activeService.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground leading-snug">{activeService.name}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {activeService.longDescription || activeService.description}
                  </p>

                  {/* MC-5: Deliverables */}
                  {activeService.deliverables && activeService.deliverables.length > 0 && (
                    <>
                      <div className="svc-panel-divider" aria-hidden="true" />
                      <ul className="flex flex-col gap-2.5 mb-4" aria-label={messages.sections.services.includedLabel}>
                        {activeService.deliverables.map((item, i) => (
                          <li key={i} className="svc-deliverable">
                            <Check size={13} className="svc-deliverable-icon" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* MC-5: Tech hints + delivery weeks */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    {activeService.techHints?.map((t) => (
                      <span key={t} className="svc-tech-pill">{t}</span>
                    ))}
                    {activeService.deliveryWeeks && (
                      <span className="svc-delivery-badge ml-auto">
                        <Clock size={11} aria-hidden="true" />
                        {activeService.deliveryWeeks}
                      </span>
                    )}
                  </div>

                  {/* CTA link */}
                  <Link
                    href={config.routes.service(activeService.slug)}
                    className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {messages.cta.exploreService}
                    <ChevronRight size={14} className="transition-transform duration-150 group-hover/link:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* MC-6: Mobile accordion (replaces static grid) */}
          <div
            data-testid="services-grid"
            className={`flex flex-col gap-2 lg:hidden ${hasIntersected ? 'svc-stagger-3' : 'opacity-0'}`}
          >
            {services.map((service) => {
              const isOpen = mobileExpandedId === service.slug
              return (
                <div key={service.slug} className="svc-accordion-card">
                  <button
                    type="button"
                    className="svc-accordion-trigger"
                    onClick={() => setMobileExpandedId(isOpen ? null : service.slug)}
                    aria-expanded={isOpen}
                    aria-controls={`svc-acc-${service.slug}`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base"
                      role="img"
                      aria-label={service.name}
                    >
                      {service.icon}
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      {service.name}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`svc-chevron ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  <div
                    id={`svc-acc-${service.slug}`}
                    className={`svc-accordion-body ${isOpen ? 'svc-accordion-open' : ''}`}
                  >
                    <div className="svc-accordion-content">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {service.longDescription || service.description}
                      </p>

                      {/* Deliverables on mobile */}
                      {service.deliverables && (
                        <ul className="flex flex-col gap-2" aria-label={messages.sections.services.includedLabel}>
                          {service.deliverables.map((item, i) => (
                            <li key={i} className="svc-deliverable">
                              <Check size={12} className="svc-deliverable-icon" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Tech + delivery */}
                      {(service.techHints || service.deliveryWeeks) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {service.techHints?.map((t) => (
                            <span key={t} className="svc-tech-pill">{t}</span>
                          ))}
                          {service.deliveryWeeks && (
                            <span className="svc-delivery-badge">
                              <Clock size={10} aria-hidden="true" />
                              {service.deliveryWeeks}
                            </span>
                          )}
                        </div>
                      )}

                      <Link
                        href={config.routes.service(service.slug)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-1"
                      >
                        {messages.cta.exploreService}
                        <ChevronRight size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </Container>
    </section>
  )
}
