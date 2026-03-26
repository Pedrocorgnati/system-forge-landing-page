/**
 * lib/constants/messages.ts
 * Mensagens de feedback para o usuário em pt-BR.
 * Centralizar aqui evita strings duplicadas nos componentes.
 */

export const MESSAGES = {
  // Newsletter
  SUCCESS_NEWSLETTER: 'Inscrição confirmada! Bem-vindo(a) ao Inbound Forge.',
  ERROR_NEWSLETTER_DUPLICATE: 'Este e-mail já está inscrito.',
  ERROR_NEWSLETTER_INVALID: 'Por favor, insira um e-mail válido.',
  ERROR_NEWSLETTER_GENERIC: 'Erro ao processar inscrição. Tente novamente.',

  // Formulário de contato
  SUCCESS_CONTACT: 'Mensagem enviada! Retornaremos em até 24h.',
  ERROR_CONTACT_GENERIC: 'Erro ao enviar mensagem. Tente pelo WhatsApp.',

  // Erros genéricos
  ERROR_GENERIC: 'Algo deu errado. Por favor, tente novamente.',
  ERROR_NOT_FOUND: 'Página não encontrada.',
  ERROR_NETWORK: 'Sem conexão. Verifique sua internet.',

  // Estados vazios
  EMPTY_PORTFOLIO: 'Nenhum projeto encontrado para esta categoria.',
  EMPTY_BLOG: 'Nenhum artigo encontrado.',
  EMPTY_SEARCH: (query: string) => `Nenhum resultado para "${query}".`,

  // Loading
  LOADING_GENERIC: 'Carregando...',
  LOADING_SEARCH: 'Buscando...',

  // CTAs
  CTA_WHATSAPP: 'Falar pelo WhatsApp',
  CTA_CALENDLY: 'Agendar conversa',
  CTA_BUDGET: 'Calcular orçamento',
  CTA_CONTACT: 'Entrar em contato',
  CTA_PORTFOLIO: 'Ver portfólio completo',
  CTA_SERVICES: 'Ver todos os serviços',
  CTA_READ_MORE: 'Ler artigo completo',

  // Acessibilidade
  ARIA_MENU_TOGGLE: 'Abrir/fechar menu',
  ARIA_CLOSE: 'Fechar',
  ARIA_EXTERNAL_LINK: '(abre em nova aba)',
} as const
