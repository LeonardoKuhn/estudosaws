import IORedis, { Redis } from 'ioredis';

/**
 * Single source of truth for the queue configuration.
 *
 * Both the Queue (in the API process, which enqueues jobs) and the Worker
 * (in the separate process, which consumes jobs) import from here. This way
 * the Redis connection is defined ONCE and never duplicated.
 */

// Queue name used by the Queue (producer) and the Worker (consumer).
export const CLICKS_QUEUE = 'clicks';

// DI token for the Queue in Nest (see clicks.module.ts).
export const CLICKS_QUEUE_TOKEN = 'CLICKS_QUEUE_TOKEN';

/**
 * Creates a Redis connection from REDIS_URL.
 *
 * `maxRetriesPerRequest: null` is required by BullMQ for connections used by
 * Workers (they rely on blocking commands). It is harmless for the Queue, so
 * we use the same factory on both sides.
 */
export function createRedisConnection(): Redis {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  return new IORedis(url, { maxRetriesPerRequest: null });
}
