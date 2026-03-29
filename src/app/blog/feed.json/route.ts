/**
 * src/app/blog/feed.json/route.ts
 * JSON Feed 1.1 endpoint para blog articles.
 *
 * Acesso: https://domain.com/blog/feed.json
 * Spec: https://www.jsonfeed.org/
 */

import { blog as allArticles } from '@/.velite'
import { getSiteConfig } from '@config'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const config = getSiteConfig()
  const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url

  // Pegar 11 artigos mais recentes
  const articles = allArticles
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 11)

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: `${config.siteName} - Blog`,
    description: 'Conteúdo sobre desenvolvimento de software, arquitetura, IA e estratégias de produto.',
    language: config.locale === 'it-IT' ? 'it' : config.locale === 'en' ? 'en' : 'pt-BR',
    home_page_url: `${baseUrl}/blog`,
    feed_url: `${baseUrl}/blog/feed.json`,
    icon: `${baseUrl}/favicon.ico`,
    favicon: `${baseUrl}/favicon.ico`,
    items: articles.map((article) => ({
      id: `${baseUrl}/blog/${article.slug}`,
      url: `${baseUrl}/blog/${article.slug}`,
      title: article.title,
      summary: article.description,
      content_text: article.description,
      content_html: `
        <img src="${article.coverImage.startsWith('http') ? article.coverImage : `${baseUrl}${article.coverImage}`}" alt="${escapeHtml(article.title)}" style="max-width: 100%; height: auto;" />
        <p>${escapeHtml(article.description)}</p>
        <p><a href="${baseUrl}/blog/${article.slug}">Leia o artigo completo →</a></p>
      `,
      image: article.coverImage.startsWith('http')
        ? article.coverImage
        : `${baseUrl}${article.coverImage}`,
      date_published: new Date(article.date).toISOString(),
      author: {
        name: article.author,
      },
      tags: article.tags,
    })),
  }

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
