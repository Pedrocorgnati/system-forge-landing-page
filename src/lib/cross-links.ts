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
 *
 * Sem esse campo, o artigo não aparecerá como "Artigo Relacionado"
 * nas páginas de serviço e o CTA contextual do artigo não será gerado.
 *
 * Ver: module-7-blog-pipeline/TASK-1.md (ST003) para a estrutura de frontmatter.
 *
 * // Contrato cross-rock: module-7 deve setar relatedService no frontmatter
 */
import { ServiceCategory } from '@/lib/types'
import type { ArticleFrontmatter, PortfolioProject } from '@/lib/types'

/**
 * Retorna os artigos relacionados a um serviço específico.
 * Filtra por `article.relatedService === service` e limita a 3 resultados.
 *
 * @param service - ServiceCategory do serviço
 * @param articles - Array completo de ArticleFrontmatter do Velite
 * @returns Array de até 3 ArticleFrontmatter relacionados
 *
 * Usado por:
 * - module-6: app/servicos/[slug]/page.tsx (RelatedArticles na ServicePage)
 * - module-7: components/blog/ArticlePage.tsx (artigos relacionados no blog)
 */
export function getRelatedArticles(
  service: ServiceCategory,
  articles: ArticleFrontmatter[],
): ArticleFrontmatter[] {
  return articles.filter((a) => a.relatedService === service).slice(0, 3)
}

/**
 * Retorna os projetos do portfólio relacionados a um serviço específico.
 * Filtra por `project.categories.includes(service)`.
 *
 * @param service - ServiceCategory do serviço
 * @param projects - Array completo de PortfolioProject
 * @returns Array de PortfolioProject relacionados (sem limite)
 *
 * Usado por:
 * - module-6: app/servicos/[slug]/page.tsx (RelatedProjects na ServicePage)
 */
export function getRelatedProjects(
  service: ServiceCategory,
  projects: PortfolioProject[],
): PortfolioProject[] {
  return projects.filter((p) => p.categories.includes(service))
}
