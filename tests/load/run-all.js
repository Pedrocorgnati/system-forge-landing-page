/**
 * Orquestrador — Load Test Suite Completo
 * SystemForge Landing Page (https://forjadesistemas.com.br)
 *
 * ATENÇÃO: Este arquivo executa TODOS os cenários em sequência.
 * Para executar um cenário específico:
 *   k6 run tests/load/scenarios/home.js
 *
 * Uso:
 *   k6 run tests/load/run-all.js                                    # smoke (1 VU, 1min)
 *   k6 run --env SCENARIO=average_load tests/load/run-all.js        # carga média
 *   k6 run --env SCENARIO=stress tests/load/run-all.js              # stress
 *   k6 run --env BASE_URL=https://staging.forjadesistemas.com.br tests/load/run-all.js
 *
 * Nota: k6 retorna exit code != 0 quando thresholds são violados.
 * Use isso como gate de performance no CI/CD (ver /ci-cd-create).
 */
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js'

const BASE_URL = __ENV.BASE_URL || 'https://forjadesistemas.com.br'
const ACTIVE_SCENARIO = __ENV.SCENARIO || 'smoke'

// Configuração de stages por tipo de cenário
const stages = {
  smoke: [{ duration: '1m', target: 1 }],
  average_load: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
}

export const options = {
  scenarios: {
    // Páginas de frequência alta — executadas com perfil completo
    homepage: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testHome',
      tags: { page: 'home' },
    },
    servicos_listing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testServicos',
      tags: { page: 'servicos' },
    },
    servico_detalhe: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testServicoDetalhe',
      tags: { page: 'servico-detalhe' },
    },
    portfolio_page: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testPortfolio',
      tags: { page: 'portfolio' },
    },
    blog_listing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testBlogListing',
      tags: { page: 'blog' },
    },
    blog_artigo: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testBlogArtigo',
      tags: { page: 'blog-artigo' },
    },
    conselheiro_page: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: stages[ACTIVE_SCENARIO] || stages.smoke,
      exec: 'testConselheiro',
      tags: { page: 'conselheiro' },
    },
  },
  thresholds: {
    // SLOs globais — derivados dos RNFs do PRD
    'http_req_duration{page:home}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{page:servicos}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{page:servico-detalhe}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{page:portfolio}': ['p(95)<600', 'p(99)<1200'],
    'http_req_duration{page:blog}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{page:blog-artigo}': ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{page:conselheiro}': ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: ACTIVE_SCENARIO,
  },
}

// Importação inline das funções de cenário
import http from 'k6/http'
import { check, sleep } from 'k6'

const defaultHeaders = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Encoding': 'gzip, deflate, br',
}

export function testHome() {
  const res = http.get(`${BASE_URL}/`, { headers: defaultHeaders, tags: { page: 'home' } })
  check(res, { 'home 200': (r) => r.status === 200 })
  sleep(1)
}

export function testServicos() {
  const res = http.get(`${BASE_URL}/servicos`, { headers: defaultHeaders, tags: { page: 'servicos' } })
  check(res, { 'servicos 200': (r) => r.status === 200 })
  sleep(1)
}

export function testServicoDetalhe() {
  const res = http.get(`${BASE_URL}/servicos/saas`, { headers: defaultHeaders, tags: { page: 'servico-detalhe' } })
  check(res, { 'servico saas 200': (r) => r.status === 200 })
  sleep(1)
}

export function testPortfolio() {
  const res = http.get(`${BASE_URL}/portfolio`, { headers: defaultHeaders, tags: { page: 'portfolio' } })
  check(res, { 'portfolio 200': (r) => r.status === 200 })
  sleep(1)
}

export function testBlogListing() {
  const res = http.get(`${BASE_URL}/blog`, { headers: defaultHeaders, tags: { page: 'blog' } })
  check(res, { 'blog 200': (r) => r.status === 200 })
  sleep(1)
}

export function testBlogArtigo() {
  const slug = __ENV.ARTICLE_SLUG || 'automacao-com-ia-para-pmes'
  const res = http.get(`${BASE_URL}/blog/${slug}`, { headers: defaultHeaders, tags: { page: 'blog-artigo' } })
  check(res, { 'artigo 200': (r) => r.status === 200 })
  sleep(1)
}

export function testConselheiro() {
  const res = http.get(`${BASE_URL}/conselheiro`, { headers: defaultHeaders, tags: { page: 'conselheiro' } })
  check(res, { 'conselheiro 200': (r) => r.status === 200 })
  sleep(1)
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'tests/load/results/summary.json': JSON.stringify(data, null, 2),
  }
}
