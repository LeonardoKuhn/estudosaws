# ---------------------------------------------------------------------------
# SINGLE image used by both the API and the worker.
# The only difference between the two services is the start command (defined in
# docker-compose: `node dist/main.js` vs `node dist/worker.js`).
# ---------------------------------------------------------------------------

# ---- Stage 1: build (install ALL deps, generate Prisma Client, compile TS)
FROM node:22-slim AS build
WORKDIR /app

# openssl is required for the Prisma engine to run.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Stage 2: runtime (slim image, only production deps + dist)
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# Generated Prisma Client + engine (we need the schema for `migrate deploy`).
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

# Default CMD runs the API. The compose overrides the worker `command` to
# `node dist/worker.js` using THIS SAME image.
CMD ["node", "dist/main.js"]
