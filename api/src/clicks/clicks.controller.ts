import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  MessageEvent,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClicksService } from './clicks.service';

@Controller('clicks')
export class ClicksController {
  private readonly logger = new Logger(ClicksController.name);

  constructor(private readonly clicksService: ClicksService) {}

  // POST /clicks -> enqueues the job and immediately responds with 202.
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async registerClick(): Promise<{ queued: true }> {
    this.logger.log('POST /clicks received — enqueuing job');
    await this.clicksService.enqueue();
    return { queued: true };
  }

  // GET /clicks/count -> current count (simple one-shot read; handy for curl).
  @Get('count')
  async count(): Promise<{ count: number }> {
    const count = await this.clicksService.count();
    return { count };
  }

  // GET /clicks/stream -> Server-Sent Events: pushes the count in real time
  // (on connect and whenever the worker finishes a job). Replaces polling.
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.clicksService
      .stream()
      .pipe(map((payload) => ({ data: payload }) as MessageEvent));
  }
}
