import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { conversionHeroMetrics } from '@/lib/data'
import heroCopyBr from '@content/pt-BR/pages/conversion-hero.json'
import heroCopyIt from '@content/it-IT/pages/conversion-hero.json'
import heroCopyEn from '@content/en/pages/conversion-hero.json'
import heroCopyEs from '@content/es-ES/pages/conversion-hero.json'
import { getLocale, type SupportedLocale } from '@config'

/**
 * Copy resolvida pelo locale do build (`NEXT_PUBLIC_LOCALE`). Os 4 catalogos
 * compartilham shape identico; a paridade locale foi entregue em task-010.
 */
const HERO_COPY_BY_LOCALE: Record<SupportedLocale, typeof heroCopyBr> = {
  'pt-BR': heroCopyBr,
  'it-IT': heroCopyIt as typeof heroCopyBr,
  'en': heroCopyEn as typeof heroCopyBr,
  'es-ES': heroCopyEs as typeof heroCopyBr,
}

const heroCopy = HERO_COPY_BY_LOCALE[getLocale()]

/**
 * ConversionHero — Server Component multi-locale (Fase A do plano conversion-machine).
 *
 * A copy artesanal de cada locale vive em `content/{locale}/pages/conversion-hero.json`
 * e e resolvida por `getLocale()` (locale fixo por build). As métricas agregadas são
 * tipadas em `src/lib/data.ts > conversionHeroMetrics`. O componente renderiza nos 4
 * builds (pt-BR, it-IT, en, es-ES) — o gate `locale === 'pt-BR'` foi removido em task-017.
 *
 * CTA primário aponta para o anchor `#solicitar-escopo`, materializado pelo formulário
 * lead-qualifier em task-003 (Fase B). Demais CTAs contextuais reusam o mesmo anchor.
 */
export function ConversionHero() {
  return (
    <section
      data-testid="section-conversion-hero"
      aria-label={heroCopy.ariaLabel}
      className="relative w-full overflow-hidden bg-background"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 hero-dot-grid" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-3xl -translate-x-1/3 translate-y-1/4" />
      </div>

      <Container>
        <div className="py-20 md:py-24 lg:py-28 flex flex-col gap-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-start">
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="hero-enter hero-delay-0 inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
                <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                {heroCopy.eyebrow}
              </div>

              <h1
                data-testid="conversion-hero-headline"
                className="hero-enter hero-delay-100 text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight"
              >
                {heroCopy.headline}
              </h1>

              <p className="hero-enter hero-delay-200 text-lg text-muted-foreground leading-relaxed">
                {heroCopy.subheadline}
              </p>

              <div className="hero-enter hero-delay-300 flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={heroCopy.ctaPrimary.anchor}
                  aria-label={heroCopy.ctaPrimary.ariaLabel}
                  data-testid="conversion-hero-cta-primary"
                  data-track-event="cta_primary_click"
                  data-track-prop-source="conversion_hero"
                  data-track-prop-label={heroCopy.ctaPrimary.label}
                  className="group inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {heroCopy.ctaPrimary.label}
                  <ArrowRight size={18} className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href={heroCopy.ctaSecondary.href}
                  data-track-event="cta_secondary_click"
                  data-track-prop-source="conversion_hero"
                  data-track-prop-label={heroCopy.ctaSecondary.label}
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-lg"
                >
                  {heroCopy.ctaSecondary.label}
                </Link>
              </div>

              <p className="hero-enter hero-delay-300 text-sm text-muted-foreground italic max-w-xl">
                {heroCopy.microcopy}
              </p>

              <ul className="hero-enter hero-delay-300 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {heroCopy.riskReverse.map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="hero-enter hero-delay-200 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 self-center"
              aria-label="Prova social agregada"
            >
              {conversionHeroMetrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-2"
                >
                  <p className="text-3xl sm:text-4xl font-bold text-primary tabular-nums leading-none">
                    {metric.value}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{metric.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{metric.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
