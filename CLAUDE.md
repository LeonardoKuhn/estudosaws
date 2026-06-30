# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A deliberately **minimal anchor project** for studying deployment. The app (an
async click counter) is intentionally trivial — the value is the full stack:
frontend + long-running API + queue worker + Postgres + Redis, running end to
end. Keep changes within this scope.

**Out of scope (do not add unless explicitly asked):** authentication, automated
tests, CI/CD, cloud deploy config, extra entities/routes/screens, or swapping the
stack. The actual cloud deploy is a separate later phase.

## Environment gotchas (read first)

- **Node is not on `PATH`.** It is installed via nvm. Prefix shell commands with:
  `export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"`
- **Docker daemon may be off.** Start it with `open -a Docker` and wait until
  `docker info` succeeds before running compose.
- **API is published on host port `3010 → 3000`** (host 3000 was already taken).
  Postgres and Redis publish **no** host ports — `api`/`worker` reach them over
  the compose internal network (hostnames `postgres` / `redis`).
- **The frontend needs `web/.env.local`** with
  `NEXT_PUBLIC_API_URL=http://localhost:3010`. Next.js does **not** read the root
  `.env`; this file is gitignored, so it must be recreated locally.
- **`ioredis` is pinned to the exact version `5.10.1`** in `api/package.json` to
  match the version BullMQ pins. Do not loosen it to a range — a second copy of
  ioredis causes a TypeScript type clash (`Redis` not assignable to
  `ConnectionOptions`) at `nest build`.

## Common commands

All Node commands assume the nvm `PATH` export above.

```bash
# Run the stateful half (postgres + redis + api + worker)
docker compose up -d --build          # build images and start
docker compose logs -f worker         # watch the worker pick up / finish jobs
docker compose logs -f api            # watch requests / enqueue / SSE pushes
docker compose down                   # stop (keeps the Postgres volume / count)
docker compose down -v                # stop and reset the database

# Frontend (runs OUTSIDE compose)
cd web && npm install && npm run dev  # http://localhost:3001

# API / worker locally without Docker (needs a reachable Postgres + Redis)
cd api && npm install
npx prisma migrate deploy
npm run start:dev                     # API on PORT (default 3000)
npm run start:worker:dev              # worker, in another terminal

# API build / Prisma
cd api && npm run build               # nest build -> dist/main.js + dist/worker.js
npx prisma generate
```

There are no automated tests. Verify changes by exercising the real flow:

```bash
# SSE end-to-end: open the stream, POST a click, watch the pushed count
curl -N --max-time 7 http://localhost:3010/clicks/stream &   # streams events
curl -s -X POST http://localhost:3010/clicks                 # triggers a job
# -> event 1: current count; event 2 (~2s later): incremented count
```

## Architecture

### One source, one image, two processes (the central concept)

`api/` builds a single Docker image (`deploy-estudo-api:latest`). The web API and
the worker are **two entry points of the same code**, differing only in the start
command — this is the whole point of the study and must stay explicit:

- `src/main.ts` → `dist/main.js` → `node dist/main.js` (NestJS HTTP server)
- `src/worker.ts` → `dist/worker.js` → `node dist/worker.js` (BullMQ worker, no port)

In `docker-compose.yml`, `api` and `worker` share the same `image:` tag (same
Image ID) and only the `command` differs. `worker.ts` is a **standalone script**
(no Nest context, its own `PrismaClient`) — chosen for simplicity; it reuses only
the shared queue config.

### Shared queue config

`src/queue/queue.constants.ts` is the single source of truth for the queue name
(`CLICKS_QUEUE`) and the Redis connection (`createRedisConnection`, which sets
`maxRetriesPerRequest: null` as BullMQ requires for workers/QueueEvents). Both the
producer (the `Queue` provider in `clicks.module.ts`) and the consumer
(`worker.ts`) import from here so the connection is never duplicated.

### Real-time updates via SSE (no polling)

The click count reaches the browser through Server-Sent Events, not polling:

1. `worker.ts` finishes a job → BullMQ emits a `completed` event (crosses process
   boundaries via Redis).
2. `ClicksService` (`onModuleInit`) subscribes to `QueueEvents('completed')`,
   re-reads the count, and pushes it through an RxJS `Subject`.
3. `ClicksController` exposes `@Sse('clicks/stream')`, which maps the subject to
   `MessageEvent`s. On connect it first emits the current count, then live
   updates.
4. The frontend (`web/app/page.tsx`) uses an `EventSource` against
   `/clicks/stream`. Idle cost is ~zero (one open connection, emits only on real
   job completion).

`GET /clicks/count` still exists as a one-shot read (handy for curl). `POST
/clicks` only enqueues a job and returns `202 { queued: true }` — no heavy work
in the request.

### Database & migrations

Single Prisma model `Click { id, createdAt }` (Prisma 6). The `api` service runs
`npx prisma migrate deploy && node dist/main.js`, so the migration is applied
before serving; the `worker` waits on the api healthcheck (`depends_on`). The init
migration under `api/prisma/migrations/` was authored by hand so the build needs
no live database.

> Note: an IDE Prisma extension may flag `datasource db { url = env(...) }` as
> unsupported — that is a Prisma 7 lint against this Prisma 6 project. The syntax
> is correct here; `prisma generate` and `migrate deploy` work.

## Conventions

- **The project language is English** — code, comments, log messages, UI, and the
  primary `README.md`. `README.pt-BR.md` is the Portuguese mirror (kept in sync).
  **Write commit messages and PR titles/descriptions in English.**
- The 2-second delay in the worker is **intentional** — it makes the async
  processing visible. Keep it.
- Everything is configured via environment variables (`.env.example` documents
  them); never hardcode connection strings or credentials.
