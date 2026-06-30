import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ClicksController } from './clicks.controller';
import { ClicksService } from './clicks.service';
import {
  CLICKS_QUEUE,
  CLICKS_QUEUE_TOKEN,
  createRedisConnection,
} from '../queue/queue.constants';

@Module({
  controllers: [ClicksController],
  providers: [
    ClicksService,
    {
      // The Queue (producer) is created with the SAME connection the worker
      // uses, coming from queue.constants. Injected into the service via
      // CLICKS_QUEUE_TOKEN.
      provide: CLICKS_QUEUE_TOKEN,
      useFactory: () =>
        new Queue(CLICKS_QUEUE, { connection: createRedisConnection() }),
    },
  ],
})
export class ClicksModule {}
