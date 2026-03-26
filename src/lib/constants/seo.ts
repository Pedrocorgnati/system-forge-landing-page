/**
 * lib/constants/seo.ts
 * Configurações padrão de SEO.
 * Usadas em lib/seo.ts (generatePageMetadata).
 */

export const SEO_DEFAULTS = {
  /** Template para tags <title>. %s é substituído pelo título da página. */
  titleTemplate: '%s | SystemForge',

  /** Título da home (não usa template) */
  homeTitle: 'SystemForge — Software House para SaaS, Mobile e Marketplace',

  /** Descrição padrão para páginas sem descrição específica */
  defaultDescription:
    'SystemForge desenvolve SaaS, aplicativos mobile, marketplaces e sistemas sob medida com qualidade de produto. Time especializado, entrega em semanas.',

  /** Imagem OG padrão (deve existir em public/images/) */
  defaultOgImage: '/images/og-default.jpg',

  /** Nome do site para OG */
  siteName: 'SystemForge',

  /** Locale para OG */
  locale: 'pt_BR',

  /** Twitter card type */
  twitterCard: 'summary_large_image' as const,

  /** Handle do Twitter/X (se houver) */
  twitterHandle: undefined as string | undefined,

  /** Robots padrão (indexável) */
  defaultRobots: 'index,follow',

  /** Robots para páginas administrativas/privadas */
  noIndexRobots: 'noindex,nofollow',
} as const
