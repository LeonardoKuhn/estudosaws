import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { Observable, Subject, concat, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import {
  CLICKS_QUEUE,
  CLICKS_QUEUE_TOKEN,
  createRedisConnection,
} from '../queue/queue.constants';

@Injectable()
export class ClicksService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClicksService.name);

  // Fan-out of count updates to every connected SSE client.
  private readonly countUpdates = new Subject<number>();
  private queueEvents?: QueueEvents;

  constructor(
    @Inject(CLICKS_QUEUE_TOKEN) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Listen to BullMQ job-completion events (which cross process boundaries via
   * Redis): whenever the worker finishes a job, re-read the count and push it
   * to every open SSE connection. This is what replaces frontend polling.
   */
  onModuleInit(): void {
    this.queueEvents = new QueueEvents(CLICKS_QUEUE, {
      connection: createRedisConnection(),
    });
    this.queueEvents.on('completed', async ({ jobId }) => {
      const count = await this.count();
      this.logger.log(`Job ${jobId} completed — pushing count=${count} via SSE`);
      this.countUpdates.next(count);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents?.close();
    this.countUpdates.complete();
  }

  /**
   * Does no heavy work: it just enqueues a job and returns.
   * The actual DB write happens in the worker (a separate process).
   */
  async enqueue(): Promise<void> {
    const job = await this.queue.add('register-click', {
      requestedAt: new Date().toISOString(),
    });
    this.logger.log(`Click enqueued (jobId=${job.id})`);
  }

  /** Counts how many clicks the worker has already processed and stored. */
  count(): Promise<number> {
    return this.prisma.click.count();
  }

  /**
   * Stream for SSE: emits the current count on connect, then every update that
   * follows a completed job. No polling involved.
   */
  stream(): Observable<{ count: number }> {
    const initial$ = from(this.count());
    return concat(initial$, this.countUpdates).pipe(map((count) => ({ count })));
  }
}
