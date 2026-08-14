import { Module } from '@nestjs/common';
import {
  MediaJobPublisherModule,
  ObjectStorageModule,
  PrismaModule,
  RabbitMqModule,
} from '@linkmovie/shared';

@Module({
  imports: [
    PrismaModule,
    ObjectStorageModule,
    RabbitMqModule,
    MediaJobPublisherModule,
  ],
})
export class AppModule {}
