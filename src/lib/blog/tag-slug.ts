/**
 * tag-slug.ts
 *
 * Slug URL-safe para tags/categorias do blog. As tags têm espaços e acentos
 * ("react native", "automazione aziendale", "automação empresarial"); usá-las
 * cruas na URL gera arquivos estáticos com ESPAÇO no nome (`react native.html`),
 * que (a) falham no upload SFTP ("Access failed: Failure") quebrando o deploy e
 * (b) dão 404 no LiteSpeed quando pedidos como `react%20native`.
 *
 * Slug canônico: minúsculas, sem acento, só [a-z0-9-]. Usado em TODA URL de
 * categoria/tag (links + generateStaticParams + lookup), de forma consistente.
 */
const DIACRITICS = /[̀-ͯ]/g

export function slugifyTag(tag: string): string {
  return tag
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Resolve um slug de volta para a(s) tag(s) originais presentes nos artigos.
 * Retorna a primeira tag cujo slug bate (para exibir o nome original no título).
 */
export function resolveTagFromSlug(slug: string, allTags: string[]): string | undefined {
  return allTags.find((t) => slugifyTag(t) === slug)
}
