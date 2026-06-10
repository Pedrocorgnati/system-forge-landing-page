#!/usr/bin/env python3
"""Generate article briefs for wave 2 NOVO clusters in pt-BR."""

import json
import os

# Load data
with open('.claude/blog/data/pt-BR/prioritized-topics/deduplicated-topics.json') as f:
    topics = json.load(f)

with open('.claude/blog/config.json') as f:
    config = json.load(f)

locale_cfg = config['locales']['pt-BR']
currency = locale_cfg['currency_symbol']
author = config['author']['name']
credentials = config['author']['credentials']['pt-BR']
cta_modes = {c['id']: c for c in locale_cfg['cta_modes']}

# Existing briefs
existing = set()
briefs_dir = '.claude/blog/data/pt-BR/article-briefs'
os.makedirs(briefs_dir, exist_ok=True)
for p in os.listdir(briefs_dir) if os.path.isdir(briefs_dir) else []:
    if p.endswith('.md'):
        existing.add(p[:-3])

# Get missing wave 2 NOVO clusters
clusters = []
for c in topics['clusters']:
    if c.get('wave') == 2 and c['classification'] == 'NOVO' and c['cluster_id'] not in existing:
        clusters.append(c)

clusters.sort(key=lambda x: (-x['priority_score'], x['cluster_id']))

SERVICE_MAP = {
    'automacao': 'automacao-empresarial',
    'chatbot': 'automacao-empresarial',
    'app-web-saas': 'sistemas-personalizados',
    'landing-page': 'desenvolvimento-web',
    'manutencao-de-sistema': 'manutencao-sistemas',
    'sistema-web-interno': 'sistemas-personalizados',
    'app-mobile': 'aplicativos-mobile',
    'site-institucional': 'desenvolvimento-web',
    'ecommerce': 'sistemas-personalizados',
    'integracao-de-sistemas': 'consultoria-tecnica',
    'api-backend': 'consultoria-tecnica',
    'dashboard-bi': 'sistemas-personalizados',
    'marketplace': 'sistemas-personalizados',
    'software-sob-medida': 'sistemas-personalizados',
    'erp-simples': 'sistemas-personalizados',
}

PILLAR_MAP = {
    'custo': 'P1 — Custos e Investimento',
    'preco': 'P1 — Custos e Investimento',
    'contratar': 'P3 — Como Contratar e Avaliar',
    'resolver': 'P3 — Como Contratar e Avaliar',
    'app-mobile': 'P2 — Tipos de Projeto e Produto',
    'app-web-saas': 'P2 — Tipos de Projeto e Produto',
    'landing-page': 'P2 — Tipos de Projeto e Produto',
    'site-institucional': 'P2 — Tipos de Projeto e Produto',
    'sistema-web-interno': 'P2 — Tipos de Projeto e Produto',
    'ecommerce': 'P8 — E-commerce e Vendas Online',
    'marketplace': 'P8 — E-commerce e Vendas Online',
    'dashboard-bi': 'P2 — Tipos de Projeto e Produto',
    'api-backend': 'P6 — Tecnologia e Stack',
    'automacao': 'P4 — Automacao e Processos Empresariais',
    'chatbot': 'P7 — IA Aplicada a Negocios',
    'integracao': 'P4 — Automacao e Processos Empresariais',
    'manutencao': 'P2 — Tipos de Projeto e Produto',
    'erp': 'P2 — Tipos de Projeto e Produto',
    'software-sob-medida': 'P2 — Tipos de Projeto e Produto',
}

def detect_type(cluster_id):
    if '-comparativa' in cluster_id:
        return 'comparacao'
    if '-dorfinanceira' in cluster_id:
        return 'preco'
    if '-nichos' in cluster_id:
        return 'nicho'
    if '-cidades' in cluster_id:
        return 'local'
    if cluster_id.startswith('contratar-'):
        return 'urgencia'
    if cluster_id.startswith('custo-'):
        return 'preco'
    if cluster_id.startswith('resolver-'):
        return 'checklist'
    return 'guia-completo'

def detect_base_topic(cluster_id):
    parts = cluster_id.replace('_merged', '').split('-')
    if parts[0] in ('contratar', 'custo', 'resolver'):
        parts = parts[1:]
    for suffix in ['comparativa', 'dorfinanceira', 'nichos', 'cidades', 'informacional', 'transacional', 'urgencia', 'comercial']:
        if parts and parts[-1] == suffix:
            parts = parts[:-1]
    return '-'.join(parts)

def get_service(cluster_id):
    base = detect_base_topic(cluster_id)
    for key, svc in SERVICE_MAP.items():
        if key in base or key in cluster_id:
            return svc
    return 'consultoria-tecnica'

def get_pillar(cluster_id):
    for key, pillar in PILLAR_MAP.items():
        if key in cluster_id:
            return pillar
    return 'P2 — Tipos de Projeto e Produto'

def get_cta(article_type, keyword):
    if 'urgente' in keyword or 'preciso' in keyword or 'urgencia' in keyword:
        return cta_modes['whatsapp']['label'], cta_modes.get('orcamento', cta_modes.get('diagnostico', cta_modes['whatsapp']))['label']
    if article_type == 'comparacao':
        return cta_modes['diagnostico']['label'], cta_modes['consultivo']['label']
    if article_type == 'preco':
        return cta_modes['whatsapp']['label'], cta_modes.get('orcamento', cta_modes['diagnostico'])['label']
    if article_type in ('nicho', 'local'):
        return cta_modes['diagnostico']['label'], cta_modes['whatsapp']['label']
    if article_type == 'urgencia':
        return cta_modes['whatsapp']['label'], cta_modes['whatsapp']['label']
    return cta_modes.get('suave', cta_modes['whatsapp'])['label'], cta_modes['diagnostico']['label']

def get_persona(cluster_id, keyword):
    if 'nicho' in cluster_id:
        return 'Dono de PME brasileira (10-50 func) buscando solucao especifica para seu segmento'
    if 'cidade' in cluster_id:
        return 'Empreendedor buscando fornecedor local de confianca'
    if 'contratar' in cluster_id:
        return 'Gestor que precisa contratar servico tecnico com urgencia'
    if 'comparativa' in cluster_id:
        return 'Empreendedor em fase de decisao comparando opcoes'
    if 'dorfinanceira' in cluster_id:
        return 'Dono de empresa preocupado com custos e ROI'
    return 'Dono de PME brasileira (10-200 func) buscando desenvolvimento de software'

def get_intent(article_type):
    return {'comparacao': 'comparativa', 'preco': 'comercial', 'nicho': 'comercial', 'local': 'comercial', 'urgencia': 'urgencia', 'checklist': 'transacional'}.get(article_type, 'informacional')

def get_funnel(article_type):
    return {'comparacao': 'meio', 'preco': 'fundo', 'nicho': 'meio-fundo', 'local': 'meio-fundo', 'urgencia': 'fundo', 'checklist': 'meio'}.get(article_type, 'meio')

def build_title(cluster_id, keyword, article_type):
    year = '2026'
    base = detect_base_topic(cluster_id)
    topic_names = {
        'automacao-de-processos': 'Automatizar Tarefas da Empresa',
        'chatbot-ia': 'Chatbot com IA',
        'app-web-saas': 'SaaS ou App Web',
        'landing-page': 'Landing Page',
        'manutencao-de-sistema': 'Manutencao de Sistema',
        'sistema-web-interno': 'Sistema Web Interno',
        'app-mobile': 'Aplicativo Mobile',
        'site-institucional': 'Site Institucional',
        'ecommerce': 'E-commerce',
        'integracao-de-sistemas': 'Integracao de Sistemas',
        'api-backend': 'API e Backend',
        'dashboard-bi': 'Dashboard e BI',
        'marketplace': 'Marketplace',
        'software-sob-medida': 'Software Sob Medida',
        'erp-simples': 'ERP Simples',
    }
    topic_name = topic_names.get(base, base.replace('-', ' ').title())
    if article_type == 'comparacao':
        if 'vale a pena' in keyword:
            return f'Vale a Pena {topic_name} no Brasil em {year}? Analise Completa'
        return f'{topic_name}: Vale a Pena em {year}? Comparativo Real para PMEs'
    if article_type == 'preco':
        return f'Quanto Custa {topic_name} no Brasil em {year}: Precos Reais e Prazos'
    if article_type == 'nicho':
        return f'{topic_name} para Nichos Especificos: O que Muda por Segmento em {year}'
    if article_type == 'local':
        return f'{topic_name} nas Principais Cidades do Brasil: Onde Encontrar em {year}'
    if article_type == 'urgencia':
        return f'Quem Faz {topic_name} com Qualidade no Brasil em {year}? Guia de Contratacao'
    if article_type == 'checklist':
        return f'Como Resolver Problemas com {topic_name}: Checklist Pratico para {year}'
    return f'{topic_name} no Brasil em {year}: Guia Completo para Empresas'

def build_h2s(cluster_id, keyword, article_type):
    base = detect_base_topic(cluster_id)
    topic = base.replace('-', ' ').title()
    if article_type == 'comparacao':
        return [
            f'Resposta Direta: Vale a Pena {topic}?',
            f'Cenario Atual do {topic} no Brasil em 2026',
            f'Quando {topic} Faz Sentido (e Quando Nao)',
            f'Investimento Real: Precos em {currency} e Prazos',
            f'Erros Comuns ao Decidir por {topic}',
            f'Alternativas e Quando Escolher Outro Caminho',
            'Perguntas Frequentes (FAQ)'
        ]
    elif article_type == 'preco':
        return [
            f'Quanto Custa {topic} em 2026: Resposta Direta',
            f'Fatores que Influenciam o Preco de {topic}',
            f'Tabela de Precos Reais em {currency} (por Complexidade)',
            f'Prazos de Entrega: do MVP ao Sistema Completo',
            f'Custos Escondidos que Ninguem Te Conta',
            f'Como Reduzir o Investimento sem Perder Qualidade',
            'Perguntas Frequentes (FAQ)'
        ]
    elif article_type == 'nicho':
        return [
            f'{topic}: O que Muda por Nicho no Brasil',
            f'Requisitos Especificos dos Principais Segmentos',
            f'Precos por Nicho em {currency} (Tabela Comparativa)',
            f'Case: {topic} para Clinica vs Restaurante vs Imobiliaria',
            f'Compliance e Regulamentacao por Segmento',
            f'Como Escolher o Parceiro Certo para Seu Nicho',
            'Perguntas Frequentes (FAQ)'
        ]
    elif article_type == 'local':
        return [
            f'{topic}: Panorama por Cidade em 2026',
            f'Onde Encontrar Especialistas em {topic}',
            f'Precos por Regiao em {currency} (Comparativo)',
            f'Vantagens de Contratar Local vs Remoto',
            f'Ecossistema Tech em Cada Regiao',
            f'Checklist para Contratar {topic} na Sua Cidade',
            'Perguntas Frequentes (FAQ)'
        ]
    elif article_type == 'urgencia':
        return [
            f'Preciso de {topic}: Por Onde Comecar em 2026',
            f'Quem Faz {topic} com Qualidade no Brasil',
            f'Como Avaliar um Fornecedor em Pouco Tempo',
            f'Prazos Realistas para {topic} (Urgente vs Normal)',
            f'Custo de Urgencia: Quanto Cobram a Mais em {currency}',
            f'Contratos e Garantias: O que Exigir na Pressa',
            'Perguntas Frequentes (FAQ)'
        ]
    elif article_type == 'checklist':
        return [
            f'Diagnostico: Qual e o Real Problema com Seu {topic}?',
            f'Checklist de Avaliacao (10 Pontos)',
            f'Opcoes de Solucao: do Simples ao Completo',
            f'Investimento Necessario em {currency}',
            f'Como Fazer a Transicao sem Parar o Negocio',
            f'Proximos Passos: Plano de Acao de 30 Dias',
            'Perguntas Frequentes (FAQ)'
        ]
    else:
        return [
            f'O que e {topic} e Para Que Serve',
            f'Como Funciona na Pratica (Exemplo Real)',
            f'Quanto Custa {topic} em {currency} em 2026',
            f'Prazos e Etapas de Implementacao',
            f'Beneficios Medidos em Numeros',
            f'Erros que Empresarios Cometem ao Implementar',
            'Perguntas Frequentes (FAQ)'
        ]

def build_faq(cluster_id, keyword, article_type):
    base = detect_base_topic(cluster_id)
    topic = base.replace('-', ' ')
    faqs = [
        f'Quanto custa {topic} no Brasil em 2026?',
        f'Quanto tempo leva para implementar {topic}?',
    ]
    if article_type == 'comparacao':
        faqs.extend([
            f'Vale a pena investir em {topic} para uma PME?',
            f'Qual a diferenca entre {topic} e fazer internamente?',
            f'Quais sao os riscos de nao usar {topic}?',
            f'Como escolher o melhor fornecedor de {topic}?',
            f'{topic} e seguro para dados da empresa?',
        ])
    elif article_type == 'preco':
        faqs.extend([
            f'Por que os precos de {topic} variam tanto?',
            f'Existe diferenca de preco por regiao do Brasil?',
            f'Posso pagar {topic} em parcelas?',
            f'O que esta incluido no preco de {topic}?',
            f'Como saber se estou pagando caro demais?',
        ])
    elif article_type == 'nicho':
        faqs.extend([
            f'Qual nicho tem o melhor custo-beneficio para {topic}?',
            f'{topic} para clinica e diferente de restaurante?',
            f'Preciso de licencas especificas por segmento?',
            f'Como adaptar {topic} para o meu nicho?',
        ])
    elif article_type == 'local':
        faqs.extend([
            f'E melhor contratar {topic} local ou remoto?',
            f'Quais cidades tem mais especialistas em {topic}?',
            f'O preco de {topic} varia muito entre cidades?',
            f'Como encontrar fornecedores confiaveis na minha cidade?',
        ])
    elif article_type == 'urgencia':
        faqs.extend([
            f'Consigo {topic} em menos de 2 semanas?',
            f'Contratar com urgencia e mais caro? Quanto?',
            f'Como nao cair em golpes ao contratar na pressa?',
            f'Quais documentos preciso ter prontos?',
        ])
    elif article_type == 'checklist':
        faqs.extend([
            f'Qual e o primeiro passo para resolver meu problema?',
            f'Preciso parar meu sistema atual para migrar?',
            f'Quanto tempo leva uma migracao completa?',
            f'Como garantir que nao vou perder dados?',
        ])
    else:
        faqs.extend([
            f'Preciso de equipe interna para manter {topic}?',
            f'{topic} funciona para empresas de qualquer tamanho?',
            f'Quais sao os principais erros ao implementar {topic}?',
            f'Como medir o retorno do investimento (ROI)?',
        ])
    return faqs[:7]

def build_direct_answer(cluster_id, keyword, article_type):
    base = detect_base_topic(cluster_id)
    topic = base.replace('-', ' ')
    if article_type == 'comparacao':
        return f'Sim, {topic} vale a pena para a maioria das PMEs brasileiras em 2026 — desde que o investimento esteja alinhado ao estagio do negocio. Empresas que implementam {topic} bem feito veem retorno em 3-6 meses, com ganhos de produtividade entre 20% e 40%. O segredo e escolher o parceiro certo e evitar solucoes genericas que nao atendem as especificidades do mercado brasileiro, como integracao com PIX, SPED e LGPD.'
    elif article_type == 'preco':
        return f'O investimento em {topic} no Brasil em 2026 varia entre {currency} 3.000 e {currency} 150.000, dependendo da complexidade, integracoes necessarias e prazo. Uma solucao basica para PMEs sai entre {currency} 5.000 e {currency} 15.000, ja uma versao enterprise com multiplas integracoes pode ultrapassar {currency} 80.000. Prazos tipicos: 2-4 semanas para MVP e 2-4 meses para sistema completo. Abaixo, detalhamos cada fator de precificacao com numeros reais do mercado.'
    elif article_type == 'nicho':
        return f'{topic.title()} para nichos especificos no Brasil exige adaptacoes que solucoes genericas nao oferecem. Cada segmento — da clinica medica ao restaurante — tem regras de compliance, fluxos de trabalho e integracoes proprias. O investimento varia entre {currency} 5.000 (versao basica para nichos simples) e {currency} 50.000 (sistemas com integracoes fiscais e multiplos usuarios). A seguir, mostramos o que muda por segmento e como escolher a solucao certa.'
    elif article_type == 'local':
        return f'Contratar {topic} nas principais cidades do Brasil em 2026 e viavel em qualquer regiao, mas precos e disponibilidade de especialistas variam significativamente. Sao Paulo e Rio de Janeiro concentram a maior oferta, com valores 10-20% acima da media. Cidades como Curitiba, Florianopolis e Belo Horizonte oferecem excelente custo-beneficio. O investimento medio varia de {currency} 5.000 a {currency} 80.000, com prazos de 2 a 12 semanas dependendo da complexidade.'
    elif article_type == 'urgencia':
        return f'Se voce precisa de {topic} com urgencia, a boa noticia e que e possivel ter um MVP funcional em 1-2 semanas no Brasil em 2026. A chave e ter um briefing claro, escolher um fornecedor com experiencia comprovada em projetos rapidos e aceitar um escopo enxuto na primeira versao. O custo de urgencia costuma ser 20-30% maior que projetos normais, mas a alternativa — perder clientes ou parar operacoes — costuma ser muito mais cara.'
    elif article_type == 'checklist':
        return f'Resolver problemas com {topic} comeca por um diagnostico honesto do que esta quebrando. Na maioria dos casos, a solucao envolve uma combinacao de modernizacao tecnica, reorganizacao de processos e treinamento da equipe. O investimento medio para resolver questoes criticas varia de {currency} 3.000 a {currency} 40.000, com prazos de 1 a 8 semanas. Abaixo, um checklist pratico de 10 pontos para avaliar sua situacao e definir os proximos passos.'
    else:
        return f'{topic.title()} e uma solucao tecnologica que resolve problemas operacionais concretos para PMEs brasileiras. Em 2026, com o avanco da IA e das ferramentas low-code, o custo de entrada caiu significativamente — uma solucao basica sai a partir de {currency} 3.000. O retorno do investimento costuma aparecer em 3-6 meses, medido em horas economizadas, erros reduzidos e capacidade de escalar o negocio sem aumentar proporcionalmente a equipe.'

def build_examples(cluster_id, article_type):
    base = detect_base_topic(cluster_id)
    if 'app-mobile' in cluster_id:
        return [
            f'App simples (1-2 telas): {currency} 15.000 - {currency} 30.000, 4-6 semanas',
            f'App medio (5-10 telas, API): {currency} 30.000 - {currency} 80.000, 8-12 semanas',
            f'App complexo (e-commerce, pagamentos): {currency} 70.000 - {currency} 200.000, 3-6 meses',
        ]
    elif 'landing-page' in cluster_id:
        return [
            f'Landing page basica (1 secao): {currency} 1.200 - {currency} 2.500, 3-5 dias',
            f'Landing page profissional (5-7 secoes, formularios): {currency} 2.500 - {currency} 5.000, 1-2 semanas',
            f'Landing page com CRO e A/B test: {currency} 5.000 - {currency} 10.000, 2-3 semanas',
        ]
    elif 'site-institucional' in cluster_id:
        return [
            f'Site institucional basico (5 paginas): {currency} 2.500 - {currency} 7.000, 2-3 semanas',
            f'Site com blog e SEO: {currency} 5.000 - {currency} 12.000, 3-4 semanas',
            f'Site enterprise (multi-idioma, CMS): {currency} 10.000 - {currency} 25.000, 1-2 meses',
        ]
    elif 'ecommerce' in cluster_id or 'marketplace' in cluster_id:
        return [
            f'Loja virtual basica (50 produtos): {currency} 5.000 - {currency} 12.000, 3-4 semanas',
            f'E-commerce com PIX, boleto, frete: {currency} 10.000 - {currency} 25.000, 1-2 meses',
            f'Marketplace multi-vendedor: {currency} 30.000 - {currency} 80.000, 2-4 meses',
        ]
    elif 'automacao' in cluster_id:
        return [
            f'Automacao de 1 processo (ex: emissao de NF): {currency} 3.000 - {currency} 8.000, 1-2 semanas',
            f'Workflow completo (3-5 processos): {currency} 8.000 - {currency} 20.000, 3-4 semanas',
            f'Automacao enterprise (ERP + integracoes): {currency} 20.000 - {currency} 50.000, 2-3 meses',
        ]
    elif 'chatbot' in cluster_id:
        return [
            f'Chatbot WhatsApp basico (FAQ): {currency} 2.000 - {currency} 5.000, 1 semana',
            f'Chatbot com IA (OpenAI/Claude): {currency} 5.000 - {currency} 12.000, 2-3 semanas',
            f'Atendimento omnichannel (WhatsApp + site): {currency} 10.000 - {currency} 25.000, 1-2 meses',
        ]
    elif 'api-backend' in cluster_id:
        return [
            f'API simples (CRUD, 5 endpoints): {currency} 5.000 - {currency} 12.000, 2-3 semanas',
            f'API com autenticacao e pagamentos: {currency} 10.000 - {currency} 25.000, 1-2 meses',
            f'Backend enterprise (microservices): {currency} 30.000 - {currency} 80.000, 2-4 meses',
        ]
    elif 'dashboard' in cluster_id:
        return [
            f'Dashboard basico (3-5 KPIs): {currency} 3.000 - {currency} 8.000, 1-2 semanas',
            f'Dashboard com integracao de dados: {currency} 8.000 - {currency} 20.000, 3-4 semanas',
            f'BI completo (multi-fonte, alertas): {currency} 15.000 - {currency} 40.000, 1-2 meses',
        ]
    elif 'manutencao' in cluster_id:
        return [
            f'Manutencao basica (correcoes, updates): {currency} 500 - {currency} 1.500/mes',
            f'Manutencao evolutiva (novas features): {currency} 1.500 - {currency} 5.000/mes',
            f'Suporte 24/7 enterprise: {currency} 5.000 - {currency} 15.000/mes',
        ]
    elif 'integracao' in cluster_id:
        return [
            f'Integracao simples (2 sistemas, API): {currency} 3.000 - {currency} 8.000, 1-2 semanas',
            f'Integracao com ERP e e-commerce: {currency} 8.000 - {currency} 20.000, 3-4 semanas',
            f'Hub de integracoes (5+ sistemas): {currency} 20.000 - {currency} 50.000, 1-3 meses',
        ]
    elif 'sistema-web' in cluster_id:
        return [
            f'Sistema basico (CRUD, relatorios): {currency} 5.000 - {currency} 15.000, 2-4 semanas',
            f'Sistema com workflow e aprovacoes: {currency} 15.000 - {currency} 40.000, 1-2 meses',
            f'Sistema enterprise (multi-tenant, API): {currency} 40.000 - {currency} 120.000, 2-4 meses',
        ]
    else:
        return [
            f'Projeto basico (MVP): {currency} 5.000 - {currency} 15.000, 2-4 semanas',
            f'Projeto medio (sistema completo): {currency} 15.000 - {currency} 50.000, 1-3 meses',
            f'Projeto enterprise: {currency} 50.000 - {currency} 150.000, 3-6 meses',
        ]

def build_objections(cluster_id, article_type):
    base = detect_base_topic(cluster_id)
    topic = base.replace('-', ' ')
    if article_type == 'preco':
        return [
            f'E caro demais para minha empresa → Mostrar ROI em 3-6 meses e comparar com custo de nao ter {topic}',
            f'Vou encontrar mais barato no mercado → Explicar diferenca entre "barato" e "custo-beneficio", riscos de gambiarras',
            f'Nao tenho budget agora → Oferecer parcelamento, MVP enxuto, ou financiamento via banco parceiro',
        ]
    elif article_type == 'comparacao':
        return [
            f'Ja vi casos que deram errado → Mostrar causas raiz (escopo mal definido, fornecedor errado) e como evitar',
            f'Nao sei se preciso disso agora → Questionario de sinais de dor: planilhas, retrabalho, perda de clientes',
            f'Parece complicado demais → Simplificar em 3 passos e mostrar cases de empresas similares',
        ]
    elif article_type == 'urgencia':
        return [
            f'Vou cair em golpe na pressa → Checklist de verificacao de fornecedor (CNPJ, portfolio, contrato)',
            f'Qualidade cai se for rapido → Explicar metodologia de MVP: entregar valor rapido, evoluir depois',
            f'Nao tenho briefing pronto → Oferecer template de briefing e diagnostico gratuito em 24h',
        ]
    else:
        return [
            f'Nao sou tecnico, nao vou entender → Usar analogias do dia a dia, evitar jargao, focar em resultado de negocio',
            f'Ja tenho planilha/sistema que "funciona" → Mostrar custo oculto do manual: horas, erros, oportunidades perdidas',
            f'Vai demorar para ver resultado → Apresentar timeline com milestones mensuraveis e quick wins',
        ]

def build_unique_angle(cluster_id, article_type):
    base = detect_base_topic(cluster_id)
    angles = {
        'automacao': 'Dados reais de produtividade de clientes brasileiros, com numeros antes/depois de automacao',
        'chatbot': 'Experiencia pratica com WhatsApp Business API e IA generativa no atendimento brasileiro',
        'app-mobile': 'Comparativo de custos reais no Brasil incluindo Apple Developer, Play Store e compliance LGPD',
        'landing-page': 'Analise de conversao real: landing pages que geram leads vs. as que so "ficam bonitas"',
        'site-institucional': 'Diferenca entre site "cartao de visitas" e site que vende, com metricas de trafego',
        'ecommerce': 'Integracao com PIX, boleto, split de pagamento e logistica brasileira (Correios, Melhor Envio)',
        'marketplace': 'Cases de marketplaces B2B e B2C no Brasil, com desafios fiscais e split de pagamento',
        'api-backend': 'Arquitetura real usada em producao para PMEs brasileiras, com stack e custos de infra',
        'dashboard-bi': 'KPIs que realmente importam para PMEs brasileiras, nao so vanity metrics',
        'integracao': 'Desafios reais de integracao no Brasil: SPED, NF-e, PIX, sistemas legados (TOTVS, Protheus)',
        'manutencao': 'Modelo de manutencao preventiva vs corretiva, com calculo de custo de downtime',
        'sistema-web-interno': 'Metodologia de entrega em 2-4 semanas para PMEs, com escopo enxuto e expansao posterior',
        'software-sob-medida': 'Processo de discovery que evita scope creep, baseado em 50+ projetos entregues',
        'erp-simples': 'Diferenca entre ERP "de prateleira" e ERP sob medida para PMEs brasileiras',
    }
    for key, angle in angles.items():
        if key in base:
            return angle
    return 'Perspectiva de quem realmente constroi software no Brasil, com precos reais e prazos honestos'

def build_risk_generic(cluster_id, article_type):
    base = detect_base_topic(cluster_id)
    topic = base.replace('-', ' ')
    return f'Evitar copy generico sobre {topic} que poderia ser escrito por qualquer IA. Nao usar definicoes de Wikipedia, nao listar "beneficios obvios" sem dados, nao prometer resultados irreais. Focar em experiencia de projeto real no Brasil, com numeros, nomes de cidades e referencias a ferramentas usadas.'

def generate_brief(cluster):
    cid = cluster['cluster_id']
    keyword = cluster['keyword_principal']
    score = cluster['priority_score']
    article_type = detect_type(cid)
    
    title = build_title(cid, keyword, article_type)
    h2s = build_h2s(cid, keyword, article_type)
    faq = build_faq(cid, keyword, article_type)
    direct_answer = build_direct_answer(cid, keyword, article_type)
    examples = build_examples(cid, article_type)
    objections = build_objections(cid, article_type)
    cta_primary, cta_secondary = get_cta(article_type, keyword)
    service = get_service(cid)
    pillar = get_pillar(cid)
    persona = get_persona(cid, keyword)
    intent = get_intent(article_type)
    funnel = get_funnel(article_type)
    unique = build_unique_angle(cid, article_type)
    risk = build_risk_generic(cid, article_type)
    
    examples_text = '\n'.join(f'   - {e}' for e in examples)
    faq_text = '\n'.join(f'{i+1}. {q}' for i, q in enumerate(faq))
    h2s_text = '\n'.join(f'{i+1}. {h}' for i, h in enumerate(h2s))
    objections_text = '\n'.join(f'{i+1}. {o}' for i, o in enumerate(objections))
    
    entry_links = '\n   - '.join(['', 'Artigos de custo relacionados no mesmo pilar', 'Paginas programaticas de nicho que mencionam este topico'])
    exit_links = ['', f'/servicos/{service}']
    if 'comparativa' in cid or 'comparacao' in article_type:
        exit_links.append('Artigo de custo correspondente (ex: quanto custa X)')
    elif 'preco' in article_type or 'custo' in cid:
        exit_links.append('Artigo comparativo correspondente (ex: vale a pena X)')
    if 'nicho' in cid:
        exit_links.append('Paginas programaticas de nicho relacionadas')
    if 'cidade' in cid:
        exit_links.append('Paginas programaticas de cidade relacionadas')
    exit_text = '\n   - '.join(exit_links)
    
    brief = f"""# Brief Editorial: {title}

## Identificacao
- **Cluster ID:** {cid}
- **Slug:** {cid}
- **Tipo:** {article_type}
- **Onda:** 2
- **Priority Score:** {score}

## Locale
- **Locale:** pt-BR
- **Idioma:** Portugues Brasileiro
- **Mercado:** Brasil
- **Moeda:** {currency}

## Intencao de Busca
- **Keyword principal:** {keyword}
- **Keywords secundarias:** {cid.replace('_merged', '').replace('-', ' ')}
- **Intencao dominante:** {intent}
- **Estagio de funil:** {funnel}
- **Persona:** {persona}

## Estrutura do Artigo

### H1: {title}

### H2s obrigatorios:
{h2s_text}

### H3s sugeridos:
- Caso real de implementacao
- Comparativo de fornecedores
- Checklist de avaliacao
- Timeline de implementacao
- Metricas de sucesso

## Conteudo Obrigatorio
- **Resposta nos primeiros 100 palavras:** {direct_answer}
- **Dados reais:**
{examples_text}
- **Exemplos concretos:** Cenarios de clientes reais no mercado brasileiro (PMEs de 10-200 func)
- **Comparacoes:** X vs Y quando aplicavel (ex: sob medida vs pronta, local vs remoto)
- **FAQ:**
{faq_text}

## Objecoes do Leitor
{objections_text}

## Conversao
- **CTA principal:** {cta_primary}
- **CTA secundario:** {cta_secondary}
- **relatedService:** {service}

## Interlinking
- **Links de entrada (artigos que devem linkar para este):**{entry_links}
- **Links de saida (este artigo deve linkar para):**{exit_text}
- **Pagina de servico relacionada:** /servicos/{service}

## Diferenciais Editoriais
- **Risco de conteudo generico:** {risk}
- **O que torna este artigo unico:** {unique}
- **Tom ideal:** Autoridade tecnica com empatia — falar como quem ja resolveu esse problema dezenas de vezes para empresas brasileiras reais

## Schema Sugerido
- [x] BlogPosting
- [x] FAQPage
- [ ] HowTo
- [ ] Service

## Notas
- Pilar editorial: {pillar}
- Autor: {author} — {credentials}
- Ano de referencia: 2026
- Compliance: LGPD
- CTA WhatsApp: {locale_cfg['whatsapp_cta_url']}
- Regras de escrita: usar "voce", nunca "senhor"; evitar "neste artigo vamos explorar"; usar numeros reais em {currency}
"""
    return brief

# Generate all briefs
generated = []
errors = []

for cluster in clusters:
    try:
        brief = generate_brief(cluster)
        filepath = os.path.join(briefs_dir, f"{cluster['cluster_id']}.md")
        with open(filepath, 'w') as f:
            f.write(brief)
        generated.append(cluster['cluster_id'])
        print(f"OK: {cluster['cluster_id']} (score={cluster['priority_score']})")
    except Exception as e:
        errors.append((cluster['cluster_id'], str(e)))
        print(f"ERRO: {cluster['cluster_id']}: {e}")

print(f"\n{'='*60}")
print(f"Total gerados: {len(generated)}")
print(f"Total erros: {len(errors)}")
if errors:
    print("Erros:")
    for cid, err in errors:
        print(f"  - {cid}: {err}")
