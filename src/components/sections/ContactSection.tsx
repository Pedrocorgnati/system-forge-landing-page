'use client'

import { useEffect, useRef } from 'react'
import { MessageCircle, CalendarDays, Calculator, ArrowRight, Mail } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { buildWhatsAppUrl } from '@/lib/cta'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { SITE } from '@/lib/constants'

const config = getSiteConfig()
const messages = loadMessages()
const ct = messages.contact

/** Derive the section id from config.routes.contact (e.g. "/#contato" -> "contato") */
const sectionId = config.routes.contact.replace(/^\/?#?/, '')

const channels = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    description: ct.whatsappDesc,
    cta: ct.whatsappCta,
    href: buildWhatsAppUrl(config.whatsapp, ct.whatsappMessage),
    external: true,
    highlight: true,
    accent: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
      glow: 'bg-emerald-500/[0.07]',
      shadow: 'hover:shadow-[0_8px_30px_rgba(34,197,94,0.15)]',
    },
  },
  {
    icon: CalendarDays,
    label: ct.scheduleLabel,
    description: ct.scheduleDesc,
    cta: ct.scheduleCta,
    href: SITE.calendly,
    external: true,
    highlight: false,
    accent: {
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'hover:border-blue-500/40',
      glow: 'bg-blue-500/[0.07]',
      shadow: 'hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]',
    },
  },
  {
    icon: Calculator,
    label: ct.budgetLabel,
    description: ct.budgetDesc,
    cta: ct.budgetCta,
    href: SITE.budgetEngine,
    external: true,
    highlight: false,
    accent: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'hover:border-amber-500/40',
      glow: 'bg-amber-500/[0.07]',
      shadow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]',
    },
  },
]

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-contact-visible', 'true')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      data-testid="section-contact"
      aria-label={messages.sections.contact.ariaLabel}
      className="relative w-full overflow-hidden bg-[#0C1120] py-20 md:py-28"
    >
      {/* Background layers */}
      <div className="contact-grid-overlay pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      {/* Gradient blobs — green, blue, amber */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-8 left-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
        <div className="absolute bottom-12 right-[10%] w-[280px] h-[280px] rounded-full bg-amber-500/[0.06] blur-[110px]" />
      </div>

      <Container>
        <div className="relative z-10 flex flex-col gap-12">
          {/* Header */}
          <div className="flex flex-col gap-4 max-w-2xl">
            <span className="contact-stagger-1 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/40">
              {ct.sectionLabel}
            </span>
            <h2 className="contact-stagger-2 text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-white leading-[1.15]">
              {ct.heading}{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                {ct.headingHighlight}
              </span>
              ?
            </h2>
            <p className="contact-stagger-3 text-white/70 text-lg leading-relaxed">
              {ct.responseTime}
            </p>
          </div>

          {/* Channel cards */}
          <div data-testid="contact-channels" className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {channels.map((channel, index) => {
              const Icon = channel.icon
              return (
                <a
                  key={channel.label}
                  data-testid={`contact-channel-${channel.label.toLowerCase().replace(/\s+/g, '-')}`}
                  href={channel.href}
                  target={channel.external ? '_blank' : undefined}
                  rel={channel.external ? 'noopener noreferrer' : undefined}
                  className={[
                    `contact-stagger-${index + 4}`,
                    'contact-card-shine group flex flex-col gap-5 p-7 rounded-2xl',
                    'backdrop-blur-xl bg-white/[0.04] border border-white/10',
                    'transition-all duration-300 ease-out',
                    'hover:-translate-y-1.5',
                    channel.accent.border,
                    channel.accent.shadow,
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30',
                  ].join(' ')}
                >
                  {/* Icon */}
                  <div className={[
                    'flex items-center justify-center w-12 h-12 rounded-xl',
                    channel.accent.bg,
                  ].join(' ')}>
                    <Icon size={22} className={`${channel.accent.text} contact-icon-glow`} aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold text-white text-lg">
                      {channel.label}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/60">
                      {channel.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <span className={[
                    'mt-auto text-sm font-medium inline-flex items-center gap-2',
                    channel.accent.text,
                  ].join(' ')}>
                    {channel.cta}
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </a>
              )
            })}
          </div>

          {/* Email fallback — glassmorphic pill */}
          <div className="contact-stagger-6 flex justify-center" aria-hidden="false">
            <a
              href={`mailto:${SITE.email}`}
              data-testid="contact-email-link"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
            >
              <Mail size={14} className="text-white/40" aria-hidden="true" />
              <span className="text-sm text-white/50">
                {ct.emailFallback}{' '}
                <span className="text-blue-400 font-medium">{SITE.email}</span>
              </span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  )
}
