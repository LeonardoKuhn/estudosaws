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
      // A Queue (produtor) é criada com a MESMA conexão que o worker usa,
      // vinda de queue.constants. Injetada no service via CLICKS_QUEUE_TOKEN.
      provide: CLICKS_QUEUE_TOKEN,
      useFactory: () =>
        new Queue(CLICKS_QUEUE, { connection: createRedisConnection() }),
    },
  ],
})
export class ClicksModule {}
