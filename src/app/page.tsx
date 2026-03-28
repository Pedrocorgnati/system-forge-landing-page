import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { ServicesGrid } from '@/components/sections/ServicesGrid'
import { PortfolioGallery } from '@/components/sections/PortfolioGallery'
import { WhySystemForge } from '@/components/sections/WhySystemForge'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTASection } from '@/components/sections/CTASection'
import { BlogPreview } from '@/components/sections/BlogPreview'
import { ContactSection } from '@/components/sections/ContactSection'
import { FaqSection } from '@/components/sections/FaqSection'
import { getSiteConfig } from '@config'

const config = getSiteConfig()

export const metadata: Metadata = {
  title: `${config.siteName} — ${config.tagline}`,
  description: config.seo.description,
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesGrid />
      <PortfolioGallery />
      <WhySystemForge />
      <TestimonialsSection />
      <FaqSection />
      <CTASection />
      <BlogPreview />
      <ContactSection />
    </>
  )
}
