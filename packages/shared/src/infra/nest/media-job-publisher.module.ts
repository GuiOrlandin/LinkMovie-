import { Global, Module } from '@nestjs/common';
import type { Channel } from 'amqplib';
import { AmqpMediaJobPublisher } from '../rabbitmq/media-job-publisher';
import { RabbitMqModule } from './rabbitmq.module';
import { AMQP_CHANNEL, MEDIA_JOB_PUBLISHER } from './tokens';

@Global()
@Module({
  imports: [RabbitMqModule],
  providers: [
    {
      provide: MEDIA_JOB_PUBLISHER,
      inject: [AMQP_CHANNEL],
      useFactory: (channel: Channel) => new AmqpMediaJobPublisher({ channel }),
    },
  ],
  exports: [MEDIA_JOB_PUBLISHER],
})
export class MediaJobPublisherModule {}
