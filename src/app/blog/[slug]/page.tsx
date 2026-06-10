import { notFound } from 'next/navigation'
import { blog as articles } from '@/.velite'
import { JsonLdBlogPosting } from '@/components/seo/JsonLdBlogPosting'
import { JsonLdBreadcrumb } from '@/components/seo/JsonLdBreadcrumb'
import { ArticlePage } from '@/components/blog/ArticlePage'
import { generatePageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getRelatedArticles } from '@/lib/cross-links'
import { ServiceCategory, type ArticleFrontmatter } from '@/lib/types'

const VALID_SERVICE_CATEGORIES: ReadonlySet<string> = new Set(Object.values(ServiceCategory))

function normalizeServiceCategory(value: string | undefined): ServiceCategory | undefined {
  return value && VALID_SERVICE_CATEGORIES.has(value) ? (value as ServiceCategory) : undefined
}
import { SITE } from '@/lib/constants'
import { getSiteConfig } from '@config'

/**
 * /blog/[slug] — Artigo individual do blog.
 *
 * FEAT-BL-007: Schema.org Article em cada artigo.
 * FEAT-BL-005: Artigos relacionados via getRelatedArticles.
 * INT-013: Open Graph + Twitter Card com coverImage do artigo.
 */

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return articles.map(article => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = articles.find(a => a.slug === slug)
  if (!article) return {}

  const siteUrl = SITE.url
  const ogImageUrl = article.coverImage.startsWith('/')
    ? `${siteUrl}${article.coverImage}`
    : article.coverImage

  return {
    ...generatePageMetadata({
      title: `${article.title} — SystemForge Blog`,
      description: article.description,
      path: `/blog/${article.slug}`,
      ogImage: ogImageUrl,
    }),
    openGraph: {
      title: article.title,
      description: article.description,
      url: `${siteUrl}/blog/${article.slug}`,
      siteName: 'SystemForge',
      locale: 'pt_BR',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [ogImageUrl],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const article = articles.find(a => a.slug === slug)

  if (!article) {
    notFound()
  }

  const siteUrl = SITE.url
  const ogImageUrl = article.coverImage.startsWith('/')
    ? `${siteUrl}${article.coverImage}`
    : article.coverImage

  // Buscar artigos relacionados via cross-links (module-6)
  const allArticlesFrontmatter: ArticleFrontmatter[] = articles.map(a => ({
    title: a.title,
    slug: a.slug,
    date: a.date,
    description: a.description,
    tags: a.tags,
    coverImage: a.coverImage,
    author: a.author,
    relatedService: normalizeServiceCategory(a.relatedService),
    readingTime: a.readingTime,
  }))

  const normalizedRelatedService = normalizeServiceCategory(article.relatedService)
  const relatedArticles = normalizedRelatedService
    ? getRelatedArticles(normalizedRelatedService, allArticlesFrontmatter)
      .filter(a => a.slug !== article.slug)
    : []

  const siteConfig = getSiteConfig()
  const breadcrumbItems = [
    { label: 'Home', url: siteConfig.routes.home },
    { label: 'Blog', url: siteConfig.routes.blog },
    { label: article.title, url: `${siteConfig.routes.blog}/${article.slug}` },
  ]

  return (
    <>
      <JsonLdBreadcrumb items={breadcrumbItems} />
      <JsonLdBlogPosting
        post={{
          title: article.title,
          slug: article.slug,
          date: article.date,
          description: article.description,
          coverImage: ogImageUrl,
        }}
        siteConfig={siteConfig}
      />
      <ArticlePage
        article={{ ...article, relatedService: normalizedRelatedService }}
        relatedArticles={relatedArticles}
      />
    </>
  )
}
