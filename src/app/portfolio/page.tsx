import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PortfolioGallery } from '@/components/sections/PortfolioGallery'
import { CTASection } from '@/components/sections/CTASection'
import { getSiteConfig } from '@config'
import { loadMessages } from '@config/content'
import { generatePageMetadata } from '@/lib/seo'

const config = getSiteConfig()
const messages = loadMessages()

export const metadata = generatePageMetadata({
  title: messages.breadcrumb.portfolio,
  description: `${messages.breadcrumb.portfolio} — ${config.siteName}`,
  path: config.routes.portfolio,
})

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: messages.breadcrumb.portfolio, href: config.routes.portfolio },
]

export default function PortfolioPage() {
  return (
    <>
      <div data-testid="page-portfolio" className="pt-12 md:pt-16 bg-surface">
        <Container>
          <div className="flex flex-col gap-4 pb-0">
            <Breadcrumb items={breadcrumbs} />
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              {messages.pages.portfolio.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {messages.pages.portfolio.description}
            </p>
          </div>
        </Container>
        <PortfolioGallery hideHeader showAll />
      </div>
      <CTASection />
    </>
  )
}
