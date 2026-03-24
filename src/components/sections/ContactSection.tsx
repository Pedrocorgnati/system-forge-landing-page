import { Container } from '@/components/ui/Container'
import { buildWhatsAppUrl } from '@/lib/cta'
import { SITE } from '@/lib/constants'

const channels = [
  {
    icon: '💬',
    label: 'WhatsApp',
    description: 'Resposta rápida em horário comercial. Ideal para tirar dúvidas e obter orçamentos.',
    cta: 'Iniciar conversa',
    href: buildWhatsAppUrl(
      '5541999999999',
      'Olá! Vi o site da SystemForge e gostaria de conversar sobre um projeto.',
    ),
    external: true,
    highlight: true,
  },
  {
    icon: '📅',
    label: 'Agendar reunião',
    description: 'Marque uma call de 30 minutos para apresentar seu projeto com calma.',
    cta: 'Ver agenda',
    href: SITE.calendly,
    external: true,
    highlight: false,
  },
  {
    icon: '🧮',
    label: 'Calcular orçamento',
    description: 'Use nossa calculadora interativa para ter uma estimativa instantânea.',
    cta: 'Calcular grátis',
    href: SITE.budgetEngine,
    external: true,
    highlight: false,
  },
]

export function ContactSection() {
  return (
    <section
      id="contato"
      data-testid="section-contact"
      aria-label="Entre em contato"
      className="w-full bg-background py-16 md:py-20"
    >
      <Container>
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              Contato
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              Vamos conversar sobre seu projeto?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Escolha o canal que preferir. Respondemos em até 2 horas em dias úteis.
            </p>
          </div>

          {/* Channel cards */}
          <div data-testid="contact-channels" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <a
                key={channel.label}
                data-testid={`contact-channel-${channel.label.toLowerCase().replace(/\s+/g, '-')}`}
                href={channel.href}
                target={channel.external ? '_blank' : undefined}
                rel={channel.external ? 'noopener noreferrer' : undefined}
                className={[
                  'group flex flex-col gap-4 p-6 rounded-xl border transition-all duration-200',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
                  channel.highlight
                    ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:shadow-md',
                ].join(' ')}
              >
                <span className="text-3xl leading-none" role="img" aria-label={channel.label}>
                  {channel.icon}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3
                    className={[
                      'font-semibold',
                      channel.highlight ? 'text-primary-foreground' : 'text-foreground',
                    ].join(' ')}
                  >
                    {channel.label}
                  </h3>
                  <p
                    className={[
                      'text-sm leading-relaxed',
                      channel.highlight ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {channel.description}
                  </p>
                </div>
                <span
                  className={[
                    'mt-auto text-sm font-medium inline-flex items-center gap-1',
                    channel.highlight
                      ? 'text-primary-foreground'
                      : 'text-primary group-hover:underline',
                  ].join(' ')}
                >
                  {channel.cta} →
                </span>
              </a>
            ))}
          </div>

          {/* Email fallback */}
          <p className="text-sm text-muted-foreground text-center">
            Prefere e-mail?{' '}
            <a
              href={`mailto:${SITE.email}`}
              data-testid="contact-email-link"
              className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-sm"
            >
              {SITE.email}
            </a>
          </p>
        </div>
      </Container>
    </section>
  )
}
