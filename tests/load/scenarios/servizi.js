/**
 * Cenário: Servizi — Mercado Italiano (/servizi)
 * Tipo: Página estática — listagem de 11 categorias
 * Locale: it-IT | Domínio: systemforge.it
 * SLO: p95 < 500ms | p99 < 1000ms | erro < 1%
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'https://systemforge.it'

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
    scenario: __ENV.SCENARIO || 'servizi',
    locale: 'it-IT',
    market: 'it',
  },
}

export default function () {
  const res = http.get(`${BASE_URL}/servizi`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'it-IT,it;q=0.9',
    },
  })

  requestDuration.add(res.timings.duration)

  const ok = check(res, {
    'servizi status 200': (r) => r.status === 200,
    'servizi latência < SLO p95': (r) => r.timings.duration < SLO_P95,
    'servizi tem conteúdo HTML': (r) => r.body && r.body.length > 0,
  })

  errorRate.add(!ok)
  sleep(1)
}
