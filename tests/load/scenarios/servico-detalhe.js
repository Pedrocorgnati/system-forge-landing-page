/**
 * Cenário: Página Individual de Serviço (/servicos/[slug])
 * Representa: 11 páginas de serviço estáticas (saas, aplicativo-mobile, marketplace, automacao-com-ia, ...)
 * SLO: p95 < 500ms | p99 < 1000ms | erro < 1%
 *
 * Para testar múltiplos slugs, defina SERVICE_SLUG via env:
 *   k6 run --env SERVICE_SLUG=marketplace tests/load/scenarios/servico-detalhe.js
 *
 * Slugs disponíveis:
 *   saas | aplicativo-mobile | marketplace | automacao-com-ia | bots-automacoes |
 *   landing-page | e-commerce | dashboard-b2b | api-integracoes | desktop | gestao-setorial
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'https://forjadesistemas.com.br'
const SERVICE_SLUG = __ENV.SERVICE_SLUG || 'saas'

const errorRate = new Rate('errors')
const requestDuration = new Trend('request_duration', true)

const SLO_P95 = 500
const SLO_P99 = 1000

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
    scenario: __ENV.SCENARIO || 'servico-detalhe',
    slug: SERVICE_SLUG,
  },
}

export default function () {
  const res = http.get(`${BASE_URL}/servicos/${SERVICE_SLUG}`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  })

  requestDuration.add(res.timings.duration)

  const ok = check(res, {
    [`servico ${SERVICE_SLUG} status 200`]: (r) => r.status === 200,
    [`servico ${SERVICE_SLUG} latência < SLO p95`]: (r) => r.timings.duration < SLO_P95,
  })

  errorRate.add(!ok)
  sleep(1)
}
