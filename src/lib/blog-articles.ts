/**
 * src/lib/blog-articles.ts
 * Helpers para artigos de blog com suporte a hreflang multi-domain.
 *
 * INT-020 — Integração Velite → hreflang por artigo.
 * module-9-seo-sitemaps TASK-1/ST008
 *
 * @STUB: Integração Velite pendente (module-6 completado).
 * Substituir implementação quando allVeliteArticles estiver disponível.
 * Convenção de frontmatter esperada:
 *   locale: 'pt-BR' | 'it-IT' | 'en'
 *   exclusive: boolean
 *   hreflang_pair: Array<{ locale: SupportedLocale; slug: string }>
 */
import type { SupportedLocale } from '@config/types'
import type { ArticleHreflang } from '@/types/hreflang.types'

/**
 * Retorna ArticleHreflang[] para o locale ativo.
 *
 * @STUB — Retorna array vazio até integração Velite estar configurada.
 * Substituir pelo corpo comentado abaixo quando module-6 estiver concluído.
 *
 * @param _activeLocale Locale do build atual
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getArticlesForLocale(_activeLocale: SupportedLocale): ArticleHreflang[] {
  // @STUB: Substituir por integração Velite (module-6)
  // Exemplo de implementação com Velite:
  //
  // import { blog as allVeliteArticles } from '@/.velite'
  //
  // const articles: ArticleHreflang[] = []
  // for (const article of allVeliteArticles) {
  //   const articleLocale = article.locale as SupportedLocale | undefined
  //   if (articleLocale !== _activeLocale) continue
  //   const exclusive = article.exclusive as boolean | undefined
  //   const hreflangPair = article.hreflang_pair as
  //     Array<{ locale: SupportedLocale; slug: string }> | undefined
  //   if (exclusive) {
  //     articles.push({ slug: article.slug, localeSlugMap: { [_activeLocale]: article.slug }, exclusive: true })
  //     continue
  //   }
  //   const localeSlugMap: Partial<Record<SupportedLocale, string>> = { [_activeLocale]: article.slug }
  //   if (hreflangPair) for (const pair of hreflangPair) localeSlugMap[pair.locale] = pair.slug
  //   articles.push({ slug: article.slug, localeSlugMap, exclusive: false })
  // }
  // return articles

  return []
}
