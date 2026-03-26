/**
 * Cenário: Artigo do Blog (/blog/[slug])
 * Tipo: Página de conteúdo — MDX renderizado, maior volume de HTML
 * SLO: p95 < 800ms | p99 < 1500ms | erro < 1%
 * Nota: SLO maior por ser a principal porta de entrada via SEO orgânico
 *
 * Para testar slug diferente:
 *   k6 run --env ARTICLE_SLUG=como-escolher-stack-saas tests/load/scenarios/blog-artigo.js
 *
 * Slugs disponíveis (detectados em content/blog/):
 *   automacao-com-ia-para-pmes | como-escolher-stack-saas | react-native-vs-flutter
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'https://forjadesistemas.com.br'
const ARTICLE_SLUG = __ENV.ARTICLE_SLUG || 'automacao-com-ia-para-pmes'

const errorRate = new Rate('errors')
const requestDuration = new Trend('request_duration', true)

const SLO_P95 = 800
const SLO_P99 = 1500

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { scenario: 'smoke' },
    },
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      startTime: '1m',
      tags: { scenario: 'average_load' },
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
      startTime: '10m',
      tags: { scenario: 'stress' },
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${SLO_P95}`, `p(99)<${SLO_P99}`],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'blog-artigo',
    slug: ARTICLE_SLUG,
  },
}

export default function () {
  const res = http.get(`${BASE_URL}/blog/${ARTICLE_SLUG}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  })

  requestDuration.add(res.timings.duration)

  const ok = check(res, {
    [`artigo ${ARTICLE_SLUG} status 200`]: (r) => r.status === 200,
    [`artigo ${ARTICLE_SLUG} latência < SLO p95`]: (r) => r.timings.duration < SLO_P95,
  })

  errorRate.add(!ok)
  sleep(1)
}
