/**
 * src/lib/blog/volatility-detection.ts
 *
 * Detector automático de `volatility_class` para o Stockpile V2.
 *
 * Heurísticas baseadas em ADR-004. Precedência: regulatory > pricing > trend > versioned > vendor > evergreen.
 * Aplica padrões sobre `title + excerpt + tags (joined)`.
 *
 * Override via `volatility_class_override` no brief é responsabilidade do caller.
 *
 * F2.4 — critério de aceite: ≥85% de precisão vs labels manuais.
 */

import type { VolatilityClass } from './stockpile-schema'

// ---------------------------------------------------------------------------
// Freshness policy defaults por classe (ADR-004)
// ---------------------------------------------------------------------------

export interface FreshnessPolicyDefaults {
  max_age_days: number
  re_review_above_days: number
}

export const FRESHNESS_POLICY_DEFAULTS: Record<VolatilityClass, FreshnessPolicyDefaults> = {
  evergreen:   { max_age_days: 180, re_review_above_days: 90 },
  versioned:   { max_age_days: 60,  re_review_above_days: 0 },
  pricing:     { max_age_days: 30,  re_review_above_days: 0 },
  regulatory:  { max_age_days: 14,  re_review_above_days: 0 },
  vendor:      { max_age_days: 21,  re_review_above_days: 0 },
  trend:       { max_age_days: 7,   re_review_above_days: 0 },
}

// ---------------------------------------------------------------------------
// Patterns (ADR-004 §Heurística de detecção automática)
// ---------------------------------------------------------------------------

// Each entry: [class, patterns[]] — applied in PRECEDENCE ORDER
// regulatory > pricing > trend > versioned > vendor > evergreen (fallback)
const CLASS_PATTERNS: Array<[VolatilityClass, RegExp[]]> = [
  [
    'regulatory',
    [
      /\b(LGPD|GDPR|NF-e|NFS-e|PIX|Verifactu|eIDAS|compliance|regulação|regulamento|lei\s+\d+)/i,
      /\b(ANPD|ANVISA|CADE|CFM|CFMV|CRO|CRC|OAB)\b/,
      /\b(normativa|norma|decreto|portaria|resolução|instrução\s+normativa)\b/i,
      /\b(GDPR|CCPA|ePrivacy|DSA|DMA|NIS2)\b/i,
      /\b(nota\s+fiscal|imposto|tributário|SPED|DCTF|GFIP|eSocial)\b/i,
    ],
  ],
  [
    'pricing',
    [
      /\b(R\$|EUR|USD|preço|custo|valor|quanto\s+custa|faixa\s+de\s+preço|tabela\s+de\s+preços)/i,
      /\b(costo|precio|prezzo|quanto\s+costa|coûte|cost)\b/i,
      /\b(orçamento|investimento|mensalidade|assinatura|plano\s+\w+)/i,
      /\$\d|\d+\s*(BRL|EUR|USD|GBP)/,
    ],
  ],
  [
    'trend',
    [
      /\b(20\d{2})\b/,
      /\btendências?\b/i,    // singular + plural: tendência, tendências
      /\btendencias\b/i,     // es-ES
      /\btendenze\b/i,       // it-IT
      /\btrends?\b/i,        // en
      /\b(no-code|low-code|vibe\s*coding|AI\s+agents?)\b/i,
      /\b(futuro\s+d[aeo]|o\s+que\s+esperar|previsão\s+para)\b/i,
    ],
  ],
  [
    'versioned',
    [
      /\b(v\d+\.\d+[\w.]*|version\s+\d+)\b/i,
      /\b(Next\.js\s+\d+|React\s+\d+|Node\.?js?\s+\d+|Python\s+3\.\d+|Angular\s+\d+|Vue\s+\d+)\b/i,
      /\b(TypeScript\s+\d+|Tailwind\s+[vV]?\d+|Prisma\s+\d+|tRPC\s+\d+)\b/i,
      /\b(lançamento|release|upgrade|migração\s+de\s+versão|atualização\s+para|migrar\s+d[oe]\s+\d+)\b/i,
      /\b(iOS\s+\d+|Android\s+\d+|macOS\s+\w+|Windows\s+\d+)\b/i,
      // Padrão genérico: NomePróprio + número de versão (X.Y) — cobre PHP 8.3, Django 5.0, etc.
      /\b[A-Z]\w+\s+\d+\.\d+\b/,
    ],
  ],
  [
    'vendor',
    [
      // "vs" só dispara quando pelo menos um dos lados é um nome próprio (começa com maiúscula)
      // Evita falso positivo em comparações arquiteturais: "monolito vs microsserviços"
      /\b[A-Z][a-zA-Z\-.]+\s+vs\.?\b|\bvs\.?\s+[A-Z][a-zA-Z\-.]+/,
      /\b(versus|comparativo|comparaison|comparazione|comparación)\b/i,
      /\b(review|melhor\s+(opção|plataforma|ferramenta|alternativa)|which\s+is\s+better)\b/i,
      /\b(Shopify|Vercel|Supabase|Stripe|Twilio|SendGrid|Firebase|AWS|GCP|Azure|Cloudflare)\b/,
      /\b(HubSpot|Salesforce|Notion|Airtable|Monday|Asana|Jira|Figma|Webflow)\b/,
      /\b(alternativa\s+(ao|a|al?)|alternative\s+to)\b/i,
    ],
  ],
  // 'evergreen' is the fallback — no patterns needed
]

// ---------------------------------------------------------------------------
// Core detector
// ---------------------------------------------------------------------------

export interface DetectionInput {
  title: string
  excerpt?: string
  tags?: string[]
  intent?: string
  /** Override manual — quando presente, retorna diretamente sem aplicar heurística */
  volatility_class_override?: string
}

export interface DetectionResult {
  volatility_class: VolatilityClass
  matched_pattern: string | null
  confidence: 'high' | 'medium' | 'fallback'
  freshness_policy: FreshnessPolicyDefaults
}

// Default for the detection algorithm is evergreen (ADR-004: "fallback quando nenhum padrão bate").
// config.stockpile.volatility_default_class = "vendor" applies when the generator skips detection entirely.
const DEFAULT_CLASS: VolatilityClass = 'evergreen'

export function detectVolatilityClass(input: DetectionInput): DetectionResult {
  // Override manual tem prioridade absoluta
  if (input.volatility_class_override) {
    const override = input.volatility_class_override as VolatilityClass
    if (override in FRESHNESS_POLICY_DEFAULTS) {
      return {
        volatility_class: override,
        matched_pattern: 'volatility_class_override',
        confidence: 'high',
        freshness_policy: FRESHNESS_POLICY_DEFAULTS[override]!,
      }
    }
  }

  // Construir corpus: title + excerpt + tags + intent
  const corpus = [
    input.title,
    input.excerpt ?? '',
    (input.tags ?? []).join(' '),
    input.intent ?? '',
  ].join(' ')

  // Aplicar padrões em ordem de precedência
  for (const [cls, patterns] of CLASS_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(corpus)) {
        return {
          volatility_class: cls,
          matched_pattern: pattern.toString(),
          confidence: 'high',
          freshness_policy: FRESHNESS_POLICY_DEFAULTS[cls]!,
        }
      }
    }
  }

  // Fallback conservador (DEC-4: volatility_default_class = vendor)
  return {
    volatility_class: DEFAULT_CLASS,
    matched_pattern: null,
    confidence: 'fallback',
    freshness_policy: FRESHNESS_POLICY_DEFAULTS[DEFAULT_CLASS]!,
  }
}

/**
 * Constrói o bloco freshness_policy para o package.json a partir da classe detectada.
 * Os sinais de gate são inferidos da classe; podem ser sobrescritos pelo caller.
 */
export function buildFreshnessPolicy(cls: VolatilityClass, extraSignals: string[] = []) {
  const defaults = FRESHNESS_POLICY_DEFAULTS[cls]!
  const baseSignals: string[] = cls === 'pricing' ? ['pricing_check'] : []

  return {
    max_age_days: defaults.max_age_days,
    rewrite_required_above_days: 0,  // desativado (DEC-4)
    freshness_gate_signals: [...baseSignals, ...extraSignals],
  }
}
