# Brief: Agente IA via WhatsApp Business API — Precio 2026

- **title**: Agente IA en WhatsApp Business API 2026: Precio, Stack y Comparativa con Chatbots No-Code
- **slug**: agente-ia-whatsapp-business-api-precio-2026
- **date**: 2026-04-25
- **locale**: es-ES
- **category**: PRIORITY (cluster wave 1, score 86)
- **type**: technical + commercial guide
- **target_word_count**: 2000-2300

## Search intent
Empresa o consultor evaluando salir de chatbot no-code (Botmaker/Landbot/ManyChat) hacia agente LLM custom via WhatsApp Business API. Quiere TCO real, stack, comparativa.

## Target keywords
- agente ia whatsapp business api precio
- whatsapp llm custom españa
- claude gpt whatsapp empresa
- alternativa landbot botmaker custom
- coste rag whatsapp pyme

## Target persona
- E-commerce o servicio con 5.000-100.000 conversaciones/mes en WhatsApp
- Director de operaciones o producto que ya probó no-code y choca con límites
- CTO que evalúa build vs buy
- Mercado: España + LatAm hispano

## Outline H2/H3

### H2: Por qué este artículo NO trata de chatbots
- Diferencia clara: chatbot reglas/flow vs agente LLM con razonamiento + tools
- Cuándo no-code es la respuesta correcta (link interno a chatbot-whatsapp-ia-empresa-costes-2026)
- Cuándo el no-code se vuelve techo

### H2: Anatomía de un agente IA via WhatsApp Business API
#### H3: Componentes obligatorios
- WhatsApp Business API (Meta Cloud API o BSP — 360dialog, Twilio, MessageBird)
- Backend (Node/Python) que recibe webhooks
- LLM con tool use (Claude 4.7 Sonnet, GPT-5, Gemini 2.5)
- Memoria conversacional (Postgres/Redis)
- RAG empresarial (pgvector, Qdrant) para conocimiento propio
- Sistema de logs y observabilidad

#### H3: Tools típicas del agente
- Consultar pedido (API ERP)
- Crear ticket soporte
- Generar PDF factura
- Agendar cita en calendario
- Escalar a humano

### H2: Comparativa TCO 24 meses — no-code vs custom

#### H3: No-code (Landbot/Botmaker/ManyChat con IA add-on)
- Setup: €0-3.000
- Mensual: €150-1.500 (escalado)
- Pricing escalado por usuarios activos / sesiones
- Mes 24 acumulado: €4.000-40.000

#### H3: Custom via WhatsApp Business API
- Setup proyecto: €15.000-45.000
- Infra mes (Vercel/Railway + Postgres + Redis + vector DB): €120-650
- LLM API (Claude/GPT) por volumen: €0,02-0,15 por conversación
- BSP fee (Meta o 360dialog): €0,03-0,08 por conversación de servicio
- Mantenimiento: 12-18% inversión inicial/año
- Mes 24 acumulado: €25.000-80.000

#### H3: Cuándo gana el custom
- Volumen >15.000 conversaciones/mes
- Necesitas RAG sobre datos propios (catálogo, base conocimiento técnica, contratos)
- Integración profunda con ERP/CRM custom
- Multi-tenant white-label
- Compliance estricto (datos no salen de tu infra Europa)

### H2: Stack recomendado 2026
- Hosting: Vercel + Railway o AWS
- Backend: Next.js Route Handlers o FastAPI
- ORM: Drizzle o Prisma
- LLM: Anthropic Claude 4.7 (con cache de prompt para system instructions)
- Vector DB: Postgres + pgvector si <1M docs, Qdrant managed si más
- Observabilidad: Langfuse o Helicone
- BSP: 360dialog (UE) o Meta Cloud directo

### H2: Precios reales WhatsApp Business API en España 2026
- Conversación de servicio (iniciada por usuario en 24h): €0,03-0,06
- Conversación de marketing (template proactivo): €0,06-0,12
- Conversación utility: €0,03-0,05
- Volumen alto = descuento BSP

### H2: Cumplimiento RGPD y consentimiento
- Opt-in explícito requerido
- Política privacidad accesible en bot
- Logs LLM con minimización
- Derecho al olvido — procedimiento técnico

### H2: Cómo implantar en 6 semanas
- Sem 1-2: setup BSP + webhook + estructura base
- Sem 3: integración LLM + 3-5 tools clave
- Sem 4: RAG + ingesta documentos
- Sem 5: testing dirigido + cola humana fallback
- Sem 6: piloto producción + ajuste umbrales

### H2: Errores comunes
- Sin fallback humano = catástrofe
- Templates marketing sin opt-in válido = baneo Meta
- LLM sin guardrails = invención de datos
- Sin cache de prompt = factura LLM x3
- Sin observabilidad = no sabes qué falla

### H2: FAQ

## Internal links required (es-ES existentes)
- [chatbot-whatsapp-ia-empresa-costes-2026](/blog/chatbot-whatsapp-ia-empresa-costes-2026) — hub no-code (OBLIGATORIO)
- [chatbot-listo-vs-chatbot-con-ia-cual-elegir](/blog/chatbot-listo-vs-chatbot-con-ia-cual-elegir)
- [coste-ia-en-produccion-como-evitar-sorpresas](/blog/coste-ia-en-produccion-como-evitar-sorpresas)
- [atencion-automatica-whatsapp-ia-empresa](/blog/atencion-automatica-whatsapp-ia-empresa)
- [bases-de-datos-vectoriales-guia-devs-ia](/blog/bases-de-datos-vectoriales-guia-devs-ia)

## E-E-A-T
Pedro Corgnati ha implantado agentes WhatsApp custom para retail español y consultoras LatAm desde 2023. Conoce el coste oculto y el dolor de migrar de Landbot.

## CTAs
1. Mid: "Calcula TU TCO real con tu volumen actual — [pídeme estimación por WhatsApp](https://wa.me/5500000000000) y te paso hoja Google."
2. Final: forjadesistemas.es /servicios/agentes-ia

## FAQ
1. ¿Cuándo merece la pena migrar de Landbot a custom?
2. ¿Meta puede banear mi número si uso LLM?
3. ¿Necesito BSP o puedo usar Cloud API directo de Meta?
4. ¿Cuánto tarda el agente custom en responder?
5. ¿Puedo usar el mismo número para humano y bot?
6. ¿Funciona offline con LLM local?
