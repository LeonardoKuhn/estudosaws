import { Module } from '@nestjs/common';
import { ClicksModule } from './clicks/clicks.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ClicksModule],
})
export class AppModule {}
