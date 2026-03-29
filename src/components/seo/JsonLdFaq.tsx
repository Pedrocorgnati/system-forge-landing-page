/**
 * src/components/seo/JsonLdFaq.tsx
 * FAQ schema (FAQPage) para exibição de Rich Snippets em SERPs.
 *
 * Uso:
 *   <JsonLdFaq items={[
 *     { question: 'Como começar?', answer: 'Clique em Contato...' },
 *     { question: 'Qual é o preço?', answer: 'Valores personalizados...' }
 *   ]} />
 */

interface FaqItem {
  question: string
  answer: string
}

interface JsonLdFaqProps {
  items: FaqItem[]
}

export function JsonLdFaq({ items }: JsonLdFaqProps) {
  const faqs = items.slice(0, 20) // Limitar a 20 para evitar sobrecarga

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      suppressHydrationWarning
    />
  )
}
