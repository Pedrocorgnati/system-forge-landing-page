import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { ServicesGrid } from '@/components/sections/ServicesGrid'
import { PortfolioBento } from '@/components/sections/PortfolioBento'
import { WhySystemForge } from '@/components/sections/WhySystemForge'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTASection } from '@/components/sections/CTASection'
import { BlogPreview } from '@/components/sections/BlogPreview'
import { ContactSection } from '@/components/sections/ContactSection'
import { FaqSection } from '@/components/sections/FaqSection'
import { JsonLdFaq } from '@/components/seo/JsonLdFaq'
import { getSiteConfig } from '@config'
import { loadContent } from '@/lib/content/content-loader'

const config = getSiteConfig()

export const metadata: Metadata = {
  title: `${config.siteName} — ${config.tagline}`,
  description: config.seo.description,
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  const faqItems = loadContent('faq', config.locale)

  return (
    <>
      <JsonLdFaq items={faqItems.map((item: any) => ({ question: item.question, answer: item.answer }))} />
      <HeroSection />
      <ServicesGrid />
      <PortfolioBento />
      <WhySystemForge />
      <TestimonialsSection />
      <FaqSection />
      <CTASection />
      <BlogPreview />
      <ContactSection />
    </>
  )
}
