import { Container } from '@/components/ui/Container'
import { SectionCTA } from '@/components/ui/SectionCTA'
import { loadContent } from '@/lib/content/content-loader'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'

export function FaqSection() {
  const config = getSiteConfig()
  const messages = loadMessages()
  const locale = config.locale
  const faqItems = loadContent('faq', locale)

  const eyebrow = 'FAQ'

  const title = locale === 'it-IT' ? 'Domande frequenti'
    : locale === 'en' ? 'Frequently Asked Questions'
    : locale === 'es-ES' ? 'Preguntas Frecuentes'
    : 'Perguntas Frequentes'

  const subtitle = locale === 'it-IT'
    ? 'Tutto ciò che devi sapere sul nostro processo di sviluppo.'
    : locale === 'en'
    ? 'Everything you need to know about our development process.'
    : locale === 'es-ES'
    ? 'Todo lo que necesitas saber sobre nuestro proceso de desarrollo.'
    : 'Tudo o que você precisa saber sobre nosso processo de desenvolvimento.'

  const ctaLead = locale === 'it-IT'
    ? 'Hai ancora domande? Raccontaci il tuo progetto e ti rispondiamo con una proposta.'
    : locale === 'en'
    ? 'Still have questions? Tell us about your project and we will reply with a proposal.'
    : locale === 'es-ES'
    ? '¿Aún tienes dudas? Cuéntanos tu proyecto y te respondemos con una propuesta.'
    : 'Ainda tem dúvidas? Conte seu projeto e respondemos com uma proposta.'

  return (
    <section
      id="faq"
      data-testid="section-faq"
      aria-label={messages.sections.faq.ariaLabel}
      className="w-full bg-background py-20 md:py-28"
    >
      <Container>
        <div className="flex flex-col gap-10 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                {eyebrow}
              </span>
              <div className="h-px w-8 bg-primary" aria-hidden="true" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
              {title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* FAQ items */}
          <dl className="flex flex-col gap-4">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <dt className="font-semibold text-foreground leading-snug mb-2">
                  {item.question}
                </dt>
                <dd className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>

          {/* Conversao: transicao FAQ -> acao primaria (locale-aware) */}
          <SectionCTA context="faq" lead={ctaLead} className="pt-2" />
        </div>
      </Container>
    </section>
  )
}
