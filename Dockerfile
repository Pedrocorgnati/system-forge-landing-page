# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
# LOCALE: br | it | en  (padrão: br — corresponde a build:br / prebuild:br)
FROM node:20-alpine AS builder
ARG LOCALE=br
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run prebuild:${LOCALE} && npm run build:${LOCALE}
# Copia para caminho fixo: COPY --from não expande variáveis na origem
RUN cp -r dist-${LOCALE} /tmp/static-export

# Stage 3: Runner (nginx serving static export)
# output: 'export' não requer Node.js em runtime — nginx serve os arquivos estáticos
FROM nginx:alpine AS runner

COPY --from=builder /tmp/static-export /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
