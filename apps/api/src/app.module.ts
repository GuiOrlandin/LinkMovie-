import { Module } from '@nestjs/common';
import {
  MediaJobPublisherModule,
  ObjectStorageModule,
  PrismaModule,
  RabbitMqModule,
} from '@linkmovie/shared';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [
    PrismaModule,
    ObjectStorageModule,
    RabbitMqModule,
    MediaJobPublisherModule,
    VideosModule,
  ],
})
export class AppModule {}
