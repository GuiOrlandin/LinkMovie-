import {
  ObjectStorageModule,
  PrismaModule,
  RabbitMqModule,
} from '@linkmovie/shared';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, ObjectStorageModule, RabbitMqModule],
})
export class AppModule {}
