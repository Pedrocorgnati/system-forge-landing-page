import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTAButton } from '@/components/ui/CTAButton'
import { CTASection } from '@/components/sections/CTASection'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'
import { buildWhatsAppCTA } from '@/lib/cta'
import { ROUTES } from '@/lib/constants/routes'

const config = getSiteConfig()
const messages = loadMessages()
const benefits = messages.sections.advisorTeaser.benefits as string[]
const whatsappCTA = buildWhatsAppCTA(messages.sections.advisorTeaser.talkToTeam, 'advisor-page')

export const metadata = generatePageMetadata({
  title: messages.breadcrumb.advisor,
  description: messages.sections.advisorTeaser.description,
  path: config.routes.advisor,
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: messages.breadcrumb.advisor, href: config.routes.advisor },
]

export default function AdvisorPage() {
  return (
    <>
      <div
        data-testid="page-advisor"
        className="py-12 md:py-20 bg-background"
        aria-label={messages.sections.advisorTeaser.ariaLabel}
      >
        <Container>
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            <Breadcrumb items={breadcrumbs} />

            {/* Header */}
            <div className="flex flex-col gap-3 items-center text-center">
              <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-border">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" aria-hidden="true" />
                {messages.sections.advisorTeaser.badge}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                {messages.sections.advisorTeaser.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {messages.sections.advisorTeaser.description}
              </p>
            </div>

            {/* Benefits */}
            <ul className="flex flex-col gap-3 w-full max-w-md mx-auto">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-success mt-0.5 shrink-0" aria-hidden="true">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* Coming soon card */}
            <div className="flex flex-col items-center gap-6 py-12 px-8 rounded-2xl border border-border border-dashed bg-surface w-full">
              <div
                className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl"
                aria-hidden="true"
              >
                🤖
              </div>
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  {messages.sections.advisorTeaser.comingSoonTitle}
                </h2>
                <p className="text-muted-foreground max-w-xs">
                  {messages.sections.advisorTeaser.comingSoonDescription}
                </p>
              </div>
              <CTAButton config={whatsappCTA} variant="primary" size="md" />
            </div>

            {/* Back to home */}
            <div className="flex justify-center">
              <Link
                href={ROUTES.HOME}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] rounded-md"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                {messages.sections.advisorTeaser.backToHome}
              </Link>
            </div>
          </div>
        </Container>
      </div>
      <CTASection />
    </>
  )
}
