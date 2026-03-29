import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CTASection } from '@/components/sections/CTASection'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'

const config = getSiteConfig()
const messages = loadMessages()

export const metadata = generatePageMetadata({
  title: messages.breadcrumb.advisor,
  description: `${messages.breadcrumb.advisor} — ${config.siteName}`,
  path: config.routes.advisor,
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: messages.breadcrumb.advisor, href: config.routes.advisor },
]

export default function ConselheiroPage() {
  return (
    <>
      <div data-testid="page-conselheiro" className="py-12 md:py-16 bg-background">
        <Container>
          <div className="flex flex-col gap-8">
            <Breadcrumb items={breadcrumbs} />

            <div className="flex flex-col gap-3 max-w-2xl">
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

            {/* Coming soon card */}
            <div className="flex flex-col items-center gap-6 py-16 rounded-2xl border border-border border-dashed bg-surface max-w-2xl">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-4xl" aria-hidden="true">
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
            </div>
          </div>
        </Container>
      </div>
      <CTASection />
    </>
  )
}
