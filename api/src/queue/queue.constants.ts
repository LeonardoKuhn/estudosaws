import IORedis, { Redis } from 'ioredis';

/**
 * Ponto único de configuração da fila.
 *
 * Tanto a Queue (no processo da API, que enfileira jobs) quanto o Worker
 * (no processo separado, que consome jobs) importam daqui. Assim a conexão
 * com o Redis é definida UMA vez só e nunca duplicada.
 */

// Nome da fila usado pela Queue (produtor) e pelo Worker (consumidor).
export const CLICKS_QUEUE = 'clicks';

// Token de injeção da Queue no Nest (ver clicks.module.ts).
export const CLICKS_QUEUE_TOKEN = 'CLICKS_QUEUE_TOKEN';

/**
 * Cria uma conexão Redis a partir de REDIS_URL.
 *
 * `maxRetriesPerRequest: null` é exigido pelo BullMQ para conexões usadas
 * por Workers (eles usam comandos bloqueantes). É inofensivo para a Queue,
 * então usamos a mesma fábrica nos dois lados.
 */
export function createRedisConnection(): Redis {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  return new IORedis(url, { maxRetriesPerRequest: null });
}
