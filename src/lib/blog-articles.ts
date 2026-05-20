/**
 * src/lib/blog-articles.ts
 * Helpers para artigos de blog com suporte a hreflang multi-domain.
 *
 * INT-020 — Integração Velite → hreflang por artigo.
 * module-9-seo-sitemaps TASK-1/ST008
 *
 * Consome a collection `blog` do Velite (locale-scoped em build time via
 * pattern `${locale}/blog/**`). Cada artigo carrega:
 *   locale: SupportedLocale          — sempre == locale do build ativo
 *   exclusive: boolean               — true = existe só neste locale (sem hreflang)
 *   hreflang_pair: Array<{ locale, slug }> — equivalentes universais nos outros locales
 */
import { blog as allVeliteArticles } from '@/.velite'
import type { SupportedLocale } from '@config/types'
import type { ArticleHreflang } from '@/types/hreflang.types'

/**
 * Retorna ArticleHreflang[] para o locale ativo.
 *
 * Wired ao Velite (substitui o @STUB que retornava []). Antes desta correção o
 * `src/app/sitemap.ts` recebia array vazio e o sitemap.xml de produção não
 * listava NENHUM post de blog — ~1221 artigos invisíveis para crawlers.
 * Ver rules/auto-publishable-blog.md §10.
 *
 * NÃO filtra por `published`: o sitemap deve refletir o que está de fato
 * publicado/crawlável. `generateStaticParams` em blog/[slug] gera página para
 * todos os artigos, então todos têm URL viva. Se `published` passar a ser
 * honrado no render, este helper deve ganhar o mesmo filtro (ver Fault B,
 * rules/auto-publishable-blog.md §10).
 *
 * @param activeLocale Locale do build atual
 */
export function getArticlesForLocale(activeLocale: SupportedLocale): ArticleHreflang[] {
  const articles: ArticleHreflang[] = []

  for (const article of allVeliteArticles) {
    // Velite já é locale-scoped em build time; guarda defensiva contra um doc
    // cruzado eventual (frontmatter `locale` divergente da pasta).
    if ((article.locale as SupportedLocale) !== activeLocale) continue

    if (article.exclusive) {
      // Artigo exclusivo: presente só neste locale — sem hreflang alternates.
      articles.push({
        slug: article.slug,
        localeSlugMap: { [activeLocale]: article.slug },
        exclusive: true,
      })
      continue
    }

    // Artigo universal: o locale ativo + os pares declarados em hreflang_pair.
    const localeSlugMap: Partial<Record<SupportedLocale, string>> = {
      [activeLocale]: article.slug,
    }
    for (const pair of article.hreflang_pair ?? []) {
      localeSlugMap[pair.locale as SupportedLocale] = pair.slug
    }

    articles.push({ slug: article.slug, localeSlugMap, exclusive: false })
  }

  return articles
}
