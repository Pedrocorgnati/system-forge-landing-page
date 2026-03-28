import type { SiteConfig } from '@config/types'

interface BlogPost {
  title: string
  slug: string
  date: string
  description: string
  coverImage?: string
  updatedAt?: string
}

interface Props {
  post: BlogPost
  siteConfig: SiteConfig
}

const MAX_HEADLINE_CHARS = 110

export function JsonLdBlogPosting({ post, siteConfig }: Props) {
  const headline =
    post.title.length > MAX_HEADLINE_CHARS
      ? post.title.slice(0, MAX_HEADLINE_CHARS)
      : post.title

  const image = post.coverImage
    ? post.coverImage.startsWith('http')
      ? post.coverImage
      : `${siteConfig.url}${post.coverImage}`
    : `${siteConfig.url}/images/og-default.png`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description: post.description,
    image,
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    inLanguage: siteConfig.locale,
    url: `${siteConfig.url}/blog/${post.slug}`,
    author: {
      '@type': 'Organization',
      name: siteConfig.siteName,
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.siteName,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${post.slug}`,
    },
  }

  const safeJson = JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}
