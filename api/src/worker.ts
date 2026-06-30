import { PrismaClient } from '@prisma/client';
import { Worker } from 'bullmq';
import { CLICKS_QUEUE, createRedisConnection } from './queue/queue.constants';

/**
 * Entry point do processo WORKER.
 *
 * Abordagem escolhida: script standalone (NÃO sobe o Nest HTTP server).
 * Motivo — é a opção mais simples: o worker só precisa do PrismaClient e do
 * BullMQ Worker, não de controllers/rotas/DI do Nest. Reaproveita do código
 * compartilhado o que importa de verdade: o nome da fila e a conexão Redis
 * (de queue.constants), garantindo que produtor e consumidor falem com o
 * mesmo Redis e a mesma fila.
 *
 * Em produção: mesma imagem Docker da API, só muda o comando de start
 * (`node dist/worker.js` em vez de `node dist/main.js`).
 */

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const worker = new Worker(
    CLICKS_QUEUE,
    async (job) => {
      console.log(`[worker] peguei job ${job.id} — processando...`);

      // Delay proposital: simula trabalho real e torna visível que o número
      // só sobe DEPOIS, porque quem processa é este processo separado.
      await sleep(2000);

      const click = await prisma.click.create({ data: {} });
      console.log(`[worker] job ${job.id} concluído — click #${click.id} gravado`);
    },
    { connection: createRedisConnection() },
  );

  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id} falhou:`, err.message);
  });

  console.log(`[worker] online, ouvindo a fila "${CLICKS_QUEUE}"`);

  // Encerramento limpo (Ctrl+C / docker stop).
  const shutdown = async (): Promise<void> => {
    console.log('[worker] encerrando...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[worker] erro fatal ao iniciar:', err);
  process.exit(1);
});
