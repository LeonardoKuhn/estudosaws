import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
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

  // GET /clicks/count -> current count (target of the frontend polling).
  @Get('count')
  async count(): Promise<{ count: number }> {
    const count = await this.clicksService.count();
    return { count };
  }
}
