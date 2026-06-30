# ---------------------------------------------------------------------------
# Imagem ÚNICA usada tanto pela API quanto pelo worker.
# A diferença entre os dois serviços é só o comando de start (definido no
# docker-compose: `node dist/main.js` vs `node dist/worker.js`).
# ---------------------------------------------------------------------------

# ---- Stage 1: build (instala TODAS as deps, gera Prisma Client, compila TS)
FROM node:22-slim AS build
WORKDIR /app

# openssl é necessário para o engine do Prisma rodar.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Stage 2: runtime (imagem enxuta, só deps de produção + dist)
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Prisma Client + engine gerados (precisamos do schema para `migrate deploy`).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# CMD default roda a API. O compose sobrescreve o `command` do worker para
# `node dist/worker.js` usando ESTA MESMA imagem.
CMD ["node", "dist/main.js"]
