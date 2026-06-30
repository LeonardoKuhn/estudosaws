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
   * Não faz trabalho pesado: só enfileira um job e volta.
   * Quem realmente grava no banco é o worker (processo separado).
   */
  async enqueue(): Promise<void> {
    const job = await this.queue.add('register-click', {
      requestedAt: new Date().toISOString(),
    });
    this.logger.log(`Clique enfileirado (jobId=${job.id})`);
  }

  /** Conta quantos cliques o worker já processou e gravou. */
  count(): Promise<number> {
    return this.prisma.click.count();
  }
}
