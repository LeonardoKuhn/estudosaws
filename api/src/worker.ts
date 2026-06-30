import { PrismaClient } from '@prisma/client';
import { Worker } from 'bullmq';
import { CLICKS_QUEUE, createRedisConnection } from './queue/queue.constants';

/**
 * Entry point for the WORKER process.
 *
 * Chosen approach: a standalone script (it does NOT start the Nest HTTP
 * server). Why — it is the simplest option: the worker only needs the
 * PrismaClient and the BullMQ Worker, not Nest controllers/routes/DI. From the
 * shared code it reuses what actually matters: the queue name and the Redis
 * connection (from queue.constants), making sure producer and consumer talk to
 * the same Redis and the same queue.
 *
 * In production: same Docker image as the API, only the start command changes
 * (`node dist/worker.js` instead of `node dist/main.js`).
 */

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const worker = new Worker(
    CLICKS_QUEUE,
    async (job) => {
      console.log(`[worker] picked up job ${job.id} — processing...`);

      // Intentional delay: simulates real work and makes it visible that the
      // number only goes up AFTERWARDS, because a separate process does it.
      await sleep(2000);

      const click = await prisma.click.create({ data: {} });
      console.log(`[worker] job ${job.id} done — click #${click.id} stored`);
    },
    { connection: createRedisConnection() },
  );

  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id} failed:`, err.message);
  });

  console.log(`[worker] online, listening on the "${CLICKS_QUEUE}" queue`);

  // Graceful shutdown (Ctrl+C / docker stop).
  const shutdown = async (): Promise<void> => {
    console.log('[worker] shutting down...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[worker] fatal error on startup:', err);
  process.exit(1);
});
