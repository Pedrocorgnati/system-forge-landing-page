import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PrivacySections } from '@/components/privacy/PrivacySections'
import { getSiteConfig, getLocale } from '@config'
import { loadMessages } from '@config/content'
import { loadContent } from '@/lib/content/content-loader'

const config = getSiteConfig()
const messages = loadMessages()
const privacyContent = loadContent('privacy', getLocale())

export const metadata: Metadata = {
  title: privacyContent.title,
  description: `${privacyContent.title} — ${config.siteName}`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${config.url}${config.routes.privacy}` },
}

const breadcrumbs = [
  { label: messages.breadcrumb.home, href: config.routes.home },
  { label: messages.breadcrumb.privacy, href: config.routes.privacy },
]

export default function PrivacyPage() {
  return (
    <div data-testid="page-privacy" className="py-12 md:py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <Breadcrumb items={breadcrumbs} />
          <div className="mt-8 prose dark:prose-invert max-w-none">
            <h1>{privacyContent.title}</h1>
            {privacyContent.lastUpdated && (
              <p className="text-muted-foreground text-sm">
                {privacyContent.lastUpdated}
              </p>
            )}
            <PrivacySections sections={privacyContent.sections} />
          </div>
        </div>
      </Container>
    </div>
  )
}
