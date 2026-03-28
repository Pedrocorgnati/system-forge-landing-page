/**
 * lib/cross-links.ts
 * Helpers de cross-linking bidirecional entre serviços, artigos e projetos.
 *
 * CONTRATO CROSS-ROCK para module-7:
 *
 * Para que getRelatedArticles() funcione nos artigos do blog,
 * os artigos MDX devem incluir no frontmatter:
 *
 *   relatedService: ServiceCategory  (ex: "saas", "aplicativo-mobile")
 *   locale: SupportedLocale          (ex: "pt-BR", "it-IT", "en")
 *
 * Campos opcionais para controle de visibilidade entre locales:
 *   hreflang_pair: Array<{locale, slug}>  (pares de tradução entre locales)
 *   exclusive: true                       (artigo apenas no seu locale)
 *
 * Ver: module-7-blog-pipeline/TASK-1.md (ST003) para a estrutura de frontmatter.
 *
 * // Contrato cross-rock: module-7 deve setar relatedService e locale no frontmatter
 */
import { ServiceCategory } from '@/lib/types'
import type { ArticleFrontmatter, PortfolioProject } from '@/lib/types'
import type { SupportedLocale } from '@config/types'
import { getActiveLocale } from '@/lib/i18n'

/**
 * Retorna os artigos relacionados a um serviço específico, filtrados por locale.
 *
 * Regras de filtro:
 * - `article.relatedService === service` (filtro por categoria)
 * - `article.locale === locale` (filtro por locale ativo do build)
 * - Exclui artigos com `exclusive === true` cujo `article.locale !== locale`
 *
 * @param service - ServiceCategory do serviço
 * @param articles - Array completo de ArticleFrontmatter do Velite
 * @param locale - Locale ativo do build. Default: getActiveLocale()
 * @returns Array de até 3 ArticleFrontmatter relacionados
 *
 * Usado por:
 * - module-6: app/servicos/[slug]/page.tsx (RelatedArticles na ServicePage)
 * - module-7: components/blog/ArticlePage.tsx (artigos relacionados no blog)
 */
export function getRelatedArticles(
  service: ServiceCategory,
  articles: ArticleFrontmatter[],
  locale: SupportedLocale = getActiveLocale(),
): ArticleFrontmatter[] {
  return articles
    .filter((a) => {
      // Filtro por serviço relacionado
      if (a.relatedService !== service) return false

      // Artigos exclusivos de outro locale são excluídos
      if (a.exclusive === true && a.locale !== locale) return false

      // Artigos sem locale definido aparecem em todos os builds (backwards compat)
      if (!a.locale) return true

      // Filtro por locale ativo (Velite já isola por build, mas defesa em profundidade)
      return a.locale === locale
    })
    .slice(0, 3)
}

/**
 * Retorna os projetos do portfólio relacionados a um serviço específico, filtrados por locale.
 *
 * Regras de filtro:
 * - `project.categories.includes(service)` (filtro por categoria)
 * - `project.locale === locale` OU `!project.locale` (sem locale = aparece em todos os builds)
 *
 * @param service - ServiceCategory do serviço
 * @param projects - Array completo de PortfolioProject
 * @param locale - Locale ativo do build. Default: getActiveLocale()
 * @returns Array de PortfolioProject relacionados
 *
 * Usado por:
 * - module-6: app/servicos/[slug]/page.tsx (RelatedProjects na ServicePage)
 */
export function getRelatedProjects(
  service: ServiceCategory,
  projects: PortfolioProject[],
  locale: SupportedLocale = getActiveLocale(),
): PortfolioProject[] {
  return projects.filter(
    (p) =>
      p.categories.includes(service) &&
      // Projetos sem locale definido são neutros — aparecem em todos os builds
      (!p.locale || p.locale === locale),
  )
}
