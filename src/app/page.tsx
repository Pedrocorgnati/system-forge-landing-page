import type { Metadata } from 'next'
import { HeroSection } from '@/components/sections/HeroSection'
import { ServicesGrid } from '@/components/sections/ServicesGrid'
import { PortfolioGallery } from '@/components/sections/PortfolioGallery'
import { WhySystemForge } from '@/components/sections/WhySystemForge'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { CTASection } from '@/components/sections/CTASection'
import { BlogPreview } from '@/components/sections/BlogPreview'
import { ContactSection } from '@/components/sections/ContactSection'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: `${SITE.name} — Software House sob medida`,
  description:
    'Software House especializada em desenvolvimento sob medida: SaaS, apps mobile, landing pages, e-commerce, dashboards e automações com IA. Do MVP ao produto escalável.',
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
      <CTASection />
      <BlogPreview />
      <ContactSection />
    </>
  )
}
