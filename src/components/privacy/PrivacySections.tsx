import type { PrivacyContent } from '@/lib/content/types'

interface PrivacySectionsProps {
  sections: PrivacyContent['sections']
}

export function PrivacySections({ sections }: PrivacySectionsProps) {
  return (
    <>
      {sections.map((section, index) => (
        <section
          key={section.id ?? index}
          id={section.id}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
          {section.paragraphs.map((paragraph, pIndex) => (
            <p key={pIndex} className="text-muted-foreground mb-3 whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </>
  )
}
