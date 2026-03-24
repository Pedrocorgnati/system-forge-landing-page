import { SITE } from './constants'

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE.url}/images/logo.svg`,
    width: 180,
    height: 40,
  },
  description: 'Software House especializada em desenvolvimento sob medida — de landing pages a sistemas complexos com IA. Metodologia proprietária, entrega rápida e qualidade enterprise.',
  founder: {
    '@type': 'Person',
    name: SITE.author,
    jobTitle: 'Fundador & Desenvolvedor Principal',
    url: SITE.linkedin,
  },
  sameAs: [SITE.linkedin, SITE.github],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    url: `https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}`,
  },
}

export function breadcrumbSchema(items: Array<{ name: string; href?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE.url}${item.href}` } : {}),
    })),
  }
}

export function articleSchema(article: {
  title: string
  description: string
  date: string
  author: string
  slug: string
  coverImage?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/images/logo.svg`,
      },
    },
    url: `${SITE.url}/blog/${article.slug}`,
    ...(article.coverImage ? { image: `${SITE.url}${article.coverImage}` } : {}),
  }
}
