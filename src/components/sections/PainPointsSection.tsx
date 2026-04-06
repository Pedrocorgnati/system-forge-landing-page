import { Container } from '@/components/ui/Container'
import { loadMessages } from '@config/content'

const m = loadMessages()
const pp = m.sections.painPoints

export function PainPointsSection() {
  return (
    <section
      data-testid="section-pain-points"
      aria-label={pp.ariaLabel}
      className="w-full bg-[hsl(var(--foreground)_/_0.03)] dark:bg-[hsl(var(--background)_/_0.6)] border-y border-border py-20 md:py-28"
    >
      <Container>
        {/* Eyebrow + heading */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs uppercase tracking-widest font-semibold text-primary mb-3">
            {pp.eyebrow}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
            {pp.heading}
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            {pp.subheading}
          </p>
        </div>

        {/* Pain point cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pp.items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 p-6 rounded-2xl bg-background border border-border hover:border-primary/30 transition-colors"
            >
              <span className="text-4xl" aria-hidden="true">{item.emoji}</span>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
