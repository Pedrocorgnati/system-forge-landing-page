export interface SearchIndexItem {
  slug: string
  title: string
  description: string
  tags: string[]
  date: string
  relatedService?: string
}

export interface SearchResult {
  item: SearchIndexItem
  score?: number
}

/**
 * Remove PII de queries de busca antes de enviar ao GA4.
 * Substitui emails, CPFs, CNPJs e telefones por [REDACTED].
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    // Email
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]')
    // CPF: 000.000.000-00 ou 00000000000
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[REDACTED]')
    // CNPJ: 00.000.000/0000-00 ou 00000000000000
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\.?\d{4}-?\d{2}\b/g, '[REDACTED]')
    // Telefone BR: (11) 99999-9999 ou 11999999999
    .replace(/\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}\b/g, '[REDACTED]')
    // Cartão de crédito (16 dígitos)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED]')
    .trim()
}
