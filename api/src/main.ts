import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Entry point do processo WEB (a API HTTP).
 * Em produção este é o `node dist/main.js`. O worker (dist/worker.js) é um
 * processo separado a partir do MESMO build — ver worker.ts.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // O frontend roda em outra origem (Next em :3001), então liberamos CORS.
  app.enableCors();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  Logger.log(`API online em http://localhost:${port}`, 'Bootstrap');
}

bootstrap();
