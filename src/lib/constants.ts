// Constantes e rotas — SystemForge Landing Page

export const SITE = {
  name: 'SystemForge',
  tagline: 'Software sob medida para transformar negócios',
  url: 'https://systemforge.dev.br',
  domain: 'systemforge.dev.br',
  author: 'Pedro Corgnati',
  email: 'pedro@systemforge.dev.br',
  whatsapp: '5541999999999', // TODO: atualizar com número real
  linkedin: 'https://linkedin.com/in/pedrocorgnati',
  github: 'https://github.com/Pedrocorgnati',
  calendly: 'https://calendly.com/systemforge', // TODO: atualizar
  budgetEngine: 'https://budget.systemforge.dev.br', // TODO: atualizar
} as const

export const ROUTES = {
  home: '/',
  servicos: '/servicos',
  portfolio: '/portfolio',
  blog: '/blog',
  contato: '/#contato',
  privacidade: '/privacidade',
  conselheiro: '/conselheiro',
  servicoSlug: (slug: string) => `/servicos/${slug}`,
  blogSlug: (slug: string) => `/blog/${slug}`,
  blogCategoria: (cat: string) => `/blog/categoria/${cat}`,
  blogTag: (tag: string) => `/blog/tag/${tag}`,
  blogPage: (n: number) => n === 1 ? '/blog' : `/blog/page/${n}`,
} as const

export const NAV_LINKS = [
  { label: 'Início', href: ROUTES.home },
  { label: 'Serviços', href: ROUTES.servicos },
  { label: 'Portfólio', href: ROUTES.portfolio },
  { label: 'Blog', href: ROUTES.blog },
  { label: 'Contato', href: ROUTES.contato },
] as const

export const BLOG_ITEMS_PER_PAGE = 12

export const STATUS_CONFIG = {
  in_progress: {
    label: 'Em andamento',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  paused: {
    label: 'Pausado',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  archived: {
    label: 'Arquivado',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
} as const
