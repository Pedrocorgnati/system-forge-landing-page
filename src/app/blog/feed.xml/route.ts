/**
 * src/app/blog/feed.xml/route.ts
 * RSS 2.0 feed endpoint para blog articles.
 *
 * Acesso: https://domain.com/blog/feed.xml
 * Inclui: 11 artigos mais recentes com full content
 */

import { blog as allArticles } from '@/.velite'
import { getSiteConfig } from '@config'

// output: 'export' — static site, não há revalidação em runtime.
export const dynamic = 'force-static'

export async function GET() {
  const config = getSiteConfig()
  const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url

  // Pegar 11 artigos mais recentes
  const articles = allArticles
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 11)

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${config.siteName} - Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Conteúdo sobre desenvolvimento de software, arquitetura, IA e estratégias de produto.</description>
    <language>${config.locale === 'it-IT' ? 'it' : config.locale === 'en' ? 'en' : 'pt-br'}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>3600</ttl>
    ${articles
      .map(
        (article) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${baseUrl}/blog/${article.slug}</link>
      <guid>${baseUrl}/blog/${article.slug}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <description>${escapeXml(article.description)}</description>
      <content:encoded><![CDATA[
        <img src="${article.coverImage.startsWith('http') ? article.coverImage : `${baseUrl}${article.coverImage}`}" alt="${escapeXml(article.title)}" />
        <p>${escapeXml(article.description)}</p>
        <p><a href="${baseUrl}/blog/${article.slug}">Leia o artigo completo →</a></p>
      ]]></content:encoded>
      <author>${escapeXml(article.author)}</author>
      ${article.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
