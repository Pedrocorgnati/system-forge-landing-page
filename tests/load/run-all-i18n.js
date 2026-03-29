/**
 * Orquestrador i18n — Load Test Triple-Market
 * SystemForge Landing Page — Mercados IT e EN
 *
 * Testa os mercados italiano (systemforge.it) e americano (systemforgesoftware.com)
 * em paralelo. Para o mercado BR, use tests/load/run-all.js.
 *
 * Uso:
 *   k6 run tests/load/run-all-i18n.js                                     # smoke (1 VU, 1min)
 *   k6 run --env SCENARIO=average_load tests/load/run-all-i18n.js         # carga média
 *   k6 run --env SCENARIO=stress tests/load/run-all-i18n.js               # stress
 *   k6 run --env MARKET=it tests/load/run-all-i18n.js                     # só mercado IT
 *   k6 run --env MARKET=en tests/load/run-all-i18n.js                     # só mercado EN
 *
 * ENVs disponíveis:
 *   BASE_URL_IT       — URL base IT (padrão: https://systemforge.it)
 *   BASE_URL_EN       — URL base EN (padrão: https://systemforgesoftware.com)
 *   SERVICE_SLUG_IT   — Slug de serviço IT (padrão: saas)
 *   SERVICE_SLUG_EN   — Slug de serviço EN (padrão: saas)
 *   ARTICLE_SLUG_IT   — Slug de artigo IT (padrão: agenti-ia-cosa-sono-e-come-applicare)
 *   ARTICLE_SLUG_EN   — Slug de artigo EN (padrão: ai-agents-what-they-are-and-when-to-use)
 *   SCENARIO          — Perfil de carga: smoke|average_load|stress (padrão: smoke)
 *   MARKET            — Filtro de mercado: it|en|all (padrão: all)
 *   COMMIT_SHA        — SHA do commit para rastreabilidade
 */
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js'
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL_IT = __ENV.BASE_URL_IT || 'https://systemforge.it'
const BASE_URL_EN = __ENV.BASE_URL_EN || 'https://systemforgesoftware.com'
const SERVICE_SLUG_IT = __ENV.SERVICE_SLUG_IT || 'saas'
const SERVICE_SLUG_EN = __ENV.SERVICE_SLUG_EN || 'saas'
const ARTICLE_SLUG_IT = __ENV.ARTICLE_SLUG_IT || 'agenti-ia-cosa-sono-e-come-applicare'
const ARTICLE_SLUG_EN = __ENV.ARTICLE_SLUG_EN || 'ai-agents-what-they-are-and-when-to-use'
const ACTIVE_SCENARIO = __ENV.SCENARIO || 'smoke'
const MARKET = __ENV.MARKET || 'all'

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

const activeStages = stages[ACTIVE_SCENARIO] || stages.smoke

// Habilita cenários por MARKET
const enableIT = MARKET === 'all' || MARKET === 'it'
const enableEN = MARKET === 'all' || MARKET === 'en'

const itScenarios = enableIT ? {
  // Mercado IT — systemforge.it
  it_home: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testHomeIT',
    tags: { page: 'home', market: 'it', locale: 'it-IT' },
  },
  it_servizi: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testServiziIT',
    tags: { page: 'servizi', market: 'it', locale: 'it-IT' },
  },
  it_servizi_detalhe: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testServiziDetalheIT',
    tags: { page: 'servizi-detalhe', market: 'it', locale: 'it-IT' },
  },
  it_portfolio: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testPortfolioIT',
    tags: { page: 'portfolio', market: 'it', locale: 'it-IT' },
  },
  it_blog_artigo: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testBlogArtigoIT',
    tags: { page: 'blog-artigo', market: 'it', locale: 'it-IT' },
  },
  it_consulente: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testConsulenteIT',
    tags: { page: 'consulente', market: 'it', locale: 'it-IT' },
  },
} : {}

const enScenarios = enableEN ? {
  // Mercado EN — systemforgesoftware.com
  en_home: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testHomeEN',
    tags: { page: 'home', market: 'en', locale: 'en' },
  },
  en_services: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testServicesEN',
    tags: { page: 'services', market: 'en', locale: 'en' },
  },
  en_service_detail: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testServiceDetailEN',
    tags: { page: 'service-detail', market: 'en', locale: 'en' },
  },
  en_portfolio: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testPortfolioEN',
    tags: { page: 'portfolio', market: 'en', locale: 'en' },
  },
  en_blog_artigo: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testBlogArtigoEN',
    tags: { page: 'blog-artigo', market: 'en', locale: 'en' },
  },
  en_advisor: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: activeStages,
    exec: 'testAdvisorEN',
    tags: { page: 'advisor', market: 'en', locale: 'en' },
  },
} : {}

export const options = {
  scenarios: { ...itScenarios, ...enScenarios },
  thresholds: {
    // IT — SLOs por página
    ...(enableIT ? {
      'http_req_duration{page:home,market:it}': ['p(95)<500', 'p(99)<1000'],
      'http_req_duration{page:servizi,market:it}': ['p(95)<500', 'p(99)<1000'],
      'http_req_duration{page:servizi-detalhe,market:it}': ['p(95)<500', 'p(99)<1000'],
      'http_req_duration{page:portfolio,market:it}': ['p(95)<600', 'p(99)<1200'],
      'http_req_duration{page:blog-artigo,market:it}': ['p(95)<800', 'p(99)<1500'],
      'http_req_duration{page:consulente,market:it}': ['p(95)<500', 'p(99)<1000'],
    } : {}),
    // EN — SLOs por página
    ...(enableEN ? {
      'http_req_duration{page:home,market:en}': ['p(95)<500', 'p(99)<1000'],
      'http_req_duration{page:services,market:en}': ['p(95)<500', 'p(99)<1000'],
      'http_req_duration{page:service-detail,market:en}': ['p(95)<500', 'p(99)<1000'],
      'http_req_duration{page:portfolio,market:en}': ['p(95)<600', 'p(99)<1200'],
      'http_req_duration{page:blog-artigo,market:en}': ['p(95)<800', 'p(99)<1500'],
      'http_req_duration{page:advisor,market:en}': ['p(95)<500', 'p(99)<1000'],
    } : {}),
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: ACTIVE_SCENARIO,
    suite: 'i18n-triple-market',
  },
}

const headers = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Encoding': 'gzip, deflate, br',
}

const headersIT = { ...headers, 'Accept-Language': 'it-IT,it;q=0.9' }
const headersEN = { ...headers, 'Accept-Language': 'en-US,en;q=0.9' }

// ---------------------------------------------------------------------------
// Funções IT
// ---------------------------------------------------------------------------

export function testHomeIT() {
  const res = http.get(`${BASE_URL_IT}/`, { headers: headersIT, tags: { page: 'home', market: 'it' } })
  check(res, { 'home-it 200': (r) => r.status === 200 })
  sleep(1)
}

export function testServiziIT() {
  const res = http.get(`${BASE_URL_IT}/servizi`, { headers: headersIT, tags: { page: 'servizi', market: 'it' } })
  check(res, { 'servizi 200': (r) => r.status === 200 })
  sleep(1)
}

export function testServiziDetalheIT() {
  const res = http.get(`${BASE_URL_IT}/servizi/${SERVICE_SLUG_IT}`, { headers: headersIT, tags: { page: 'servizi-detalhe', market: 'it' } })
  check(res, { 'servizi-detalhe 200': (r) => r.status === 200 })
  sleep(1)
}

export function testPortfolioIT() {
  const res = http.get(`${BASE_URL_IT}/portfolio`, { headers: headersIT, tags: { page: 'portfolio', market: 'it' } })
  check(res, { 'portfolio-it 200': (r) => r.status === 200 })
  sleep(1)
}

export function testBlogArtigoIT() {
  const res = http.get(`${BASE_URL_IT}/blog/${ARTICLE_SLUG_IT}`, { headers: headersIT, tags: { page: 'blog-artigo', market: 'it' } })
  check(res, { 'blog-artigo-it 200': (r) => r.status === 200 })
  sleep(1)
}

export function testConsulenteIT() {
  const res = http.get(`${BASE_URL_IT}/consulente`, { headers: headersIT, tags: { page: 'consulente', market: 'it' } })
  check(res, { 'consulente 200': (r) => r.status === 200 })
  sleep(1)
}

// ---------------------------------------------------------------------------
// Funções EN
// ---------------------------------------------------------------------------

export function testHomeEN() {
  const res = http.get(`${BASE_URL_EN}/`, { headers: headersEN, tags: { page: 'home', market: 'en' } })
  check(res, { 'home-en 200': (r) => r.status === 200 })
  sleep(1)
}

export function testServicesEN() {
  const res = http.get(`${BASE_URL_EN}/services`, { headers: headersEN, tags: { page: 'services', market: 'en' } })
  check(res, { 'services 200': (r) => r.status === 200 })
  sleep(1)
}

export function testServiceDetailEN() {
  const res = http.get(`${BASE_URL_EN}/services/${SERVICE_SLUG_EN}`, { headers: headersEN, tags: { page: 'service-detail', market: 'en' } })
  check(res, { 'service-detail 200': (r) => r.status === 200 })
  sleep(1)
}

export function testPortfolioEN() {
  const res = http.get(`${BASE_URL_EN}/portfolio`, { headers: headersEN, tags: { page: 'portfolio', market: 'en' } })
  check(res, { 'portfolio-en 200': (r) => r.status === 200 })
  sleep(1)
}

export function testBlogArtigoEN() {
  const res = http.get(`${BASE_URL_EN}/blog/${ARTICLE_SLUG_EN}`, { headers: headersEN, tags: { page: 'blog-artigo', market: 'en' } })
  check(res, { 'blog-artigo-en 200': (r) => r.status === 200 })
  sleep(1)
}

export function testAdvisorEN() {
  const res = http.get(`${BASE_URL_EN}/advisor`, { headers: headersEN, tags: { page: 'advisor', market: 'en' } })
  check(res, { 'advisor 200': (r) => r.status === 200 })
  sleep(1)
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'tests/load/results/summary-i18n.json': JSON.stringify(data, null, 2),
  }
}
