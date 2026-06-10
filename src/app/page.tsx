import type { Metadata } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import { ConversionHero } from '@/components/sections/ConversionHero'
import { HeroSection } from '@/components/sections/HeroSection'
import { LeadQualifierForm } from '@/components/sections/LeadQualifierForm'
import { ServicesGrid } from '@/components/sections/ServicesGrid'
import { PortfolioBento } from '@/components/sections/PortfolioBento'
import { WhySystemForge } from '@/components/sections/WhySystemForge'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTASection } from '@/components/sections/CTASection'
import { BlogPreview } from '@/components/sections/BlogPreview'
import { ContactSection } from '@/components/sections/ContactSection'
import { FaqSection } from '@/components/sections/FaqSection'
import { JsonLdFaq } from '@/components/seo/JsonLdFaq'
import { JsonLdOrganization } from '@/components/seo/JsonLdOrganization'
import { JsonLdService } from '@/components/seo/JsonLdService'
import { JsonLdBreadcrumb } from '@/components/seo/JsonLdBreadcrumb'
import { JsonLdWebPage } from '@/components/seo/JsonLdWebPage'
import { getSiteConfig } from '@config'
import { loadContent } from '@/lib/content/content-loader'

const config = getSiteConfig()

type LandingMeta = {
  meta: { title: string; description: string; ogAlt: string }
  services: Array<{ id: string; name: string; description: string; url: string }>
  breadcrumb: Array<{ label: string; url: string }>
}

function loadLandingMeta(): LandingMeta | null {
  if (config.locale !== 'pt-BR') return null
  const filePath = path.join(process.cwd(), 'content', 'pt-BR', 'pages', 'landing-meta.json')
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as LandingMeta
  } catch {
    return null
  }
}

const landingMeta = loadLandingMeta()

const homeTitle = landingMeta?.meta.title ?? `${config.siteName} — ${config.tagline}`
const homeDescription = landingMeta?.meta.description ?? config.seo.description
const homeOgAlt = landingMeta?.meta.ogAlt ?? config.seo.description

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: `${config.url}/`,
    siteName: config.siteName,
    locale: config.ogLocale,
    type: 'website',
    images: [
      {
        url: config.seo.ogImage,
        alt: homeOgAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [config.seo.ogImage],
  },
}

export default function HomePage() {
  const faqItems = loadContent('faq', config.locale)
  const services = landingMeta?.services ?? []
  const breadcrumb = landingMeta?.breadcrumb ?? [{ label: 'Home', url: '/' }]

  return (
    <>
      <JsonLdWebPage
        url={`${config.url}/`}
        name={homeTitle}
        description={homeDescription}
        inLanguage={config.htmlLang}
        isPartOf={{ name: config.siteName, url: config.url }}
        primaryImageOfPage={`${config.url}${config.seo.ogImage}`}
      />
      <JsonLdOrganization siteConfig={config} />
      <JsonLdBreadcrumb items={breadcrumb} />
      {services.map((service) => (
        <JsonLdService
          key={service.id}
          name={service.name}
          description={service.description}
          provider={{ name: config.siteName, url: config.url }}
          areaServed={['BR']}
          url={`${config.url}${service.url}`}
        />
      ))}
      <JsonLdFaq items={faqItems.map((item) => ({ question: item.question, answer: item.answer }))} />
      {config.locale === 'pt-BR' ? <ConversionHero /> : <HeroSection />}
      {config.locale === 'pt-BR' ? <LeadQualifierForm /> : null}
      <ContactSection />
      {/* perf-below-fold: content-visibility:auto + contain-intrinsic-size
          delega ao browser pular layout/paint destes blocos ate scroll,
          reduzindo TBT/INP sem perda de SSR/SEO. CLS travado pelo
          intrinsic-size declarado em globals.css. */}
      <div className="perf-below-fold">
        <ServicesGrid />
      </div>
      <div className="perf-below-fold">
        <PortfolioBento />
      </div>
      <div className="perf-below-fold">
        <WhySystemForge />
      </div>
      <div className="perf-below-fold">
        <TestimonialsSection />
      </div>
      <div className="perf-below-fold">
        <FaqSection />
      </div>
      <div className="perf-below-fold">
        <CTASection />
      </div>
      <div className="perf-below-fold">
        <BlogPreview />
      </div>
    </>
  )
}
