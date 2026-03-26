/**
 * lib/images.ts
 * Helpers para caminhos de imagens otimizadas.
 *
 * Os scripts/optimize-images.ts geram WebPs em 3 breakpoints:
 *   {base}_480.png, {base}_768.png, {base}_1280.png
 *
 * Este módulo retorna o caminho correto por breakpoint.
 */

type ImageBreakpoint = 480 | 768 | 1280

/**
 * Retorna o caminho da imagem PNG otimizada pelo breakpoint mais próximo.
 * Se a imagem não tiver sufixo de breakpoint, retorna o src original.
 *
 * @param src - Caminho original (ex: /images/portfolio/saas-app.jpg)
 * @param width - Largura desejada em pixels
 */
export function getOptimizedImagePath(src: string, width: number): string {
  // Imagens que já são PNG com breakpoint no nome: retornar direto
  if (src.endsWith('.png') || /_\d+\.png$/.test(src)) {
    return src
  }

  const breakpoint = selectBreakpoint(width)
  const ext = getExtension(src)

  if (!ext) return src

  const base = src.slice(0, -ext.length)
  return `${base}_${breakpoint}.png`
}

/**
 * Seleciona o breakpoint mais próximo (superior) para o width dado.
 */
function selectBreakpoint(width: number): ImageBreakpoint {
  if (width <= 480) return 480
  if (width <= 768) return 768
  return 1280
}

function getExtension(src: string): string | null {
  const match = src.match(/\.(jpg|jpeg|png|gif)$/i)
  return match ? match[0] : null
}

/**
 * Retorna o atributo sizes para next/image baseado no contexto.
 * Uso: <OptimizedImage sizes={getImageSizes('portfolio-card')} ... />
 */
export function getImageSizes(
  context: 'hero' | 'portfolio-card' | 'blog-cover' | 'avatar' | 'full-width'
): string {
  const sizesMap: Record<string, string> = {
    hero: '(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 800px',
    'portfolio-card': '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    'blog-cover': '(max-width: 768px) 100vw, (max-width: 1280px) 768px, 1024px',
    avatar: '80px',
    'full-width': '100vw',
  }
  return sizesMap[context] ?? '(max-width: 768px) 100vw, 50vw'
}
