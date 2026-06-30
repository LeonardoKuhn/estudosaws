import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CLICKS_QUEUE_TOKEN } from '../queue/queue.constants';

@Injectable()
export class ClicksService {
  private readonly logger = new Logger(ClicksService.name);

  constructor(
    @Inject(CLICKS_QUEUE_TOKEN) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

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
}
