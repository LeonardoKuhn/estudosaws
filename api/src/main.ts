import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Entry point for the WEB process (the HTTP API).
 * In production this is `node dist/main.js`. The worker (dist/worker.js) is a
 * separate process built from the SAME source — see worker.ts.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // The frontend runs on a different origin (Next on :3001), so enable CORS.
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  Logger.log(`API online at http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
