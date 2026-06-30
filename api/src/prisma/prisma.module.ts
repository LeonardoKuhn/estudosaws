import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global para que qualquer módulo (ex.: clicks) injete o PrismaService
 * sem precisar reimportar este módulo.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
