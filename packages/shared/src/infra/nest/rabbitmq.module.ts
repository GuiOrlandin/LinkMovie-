import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { connect, type Channel, type ChannelModel } from 'amqplib';
import { declareMediaJobTopology } from '../rabbitmq/topology';
import { requiredEnv } from './env';
import { AMQP_CHANNEL, AMQP_CONNECTION } from './tokens';

const RABBITMQ_RUNTIME = Symbol('RabbitMqRuntime');

type RabbitMqRuntime = {
  connection: ChannelModel;
  channel: Channel;
};

@Injectable()
class RabbitMqShutdown implements OnModuleDestroy {
  constructor(
    @Inject(AMQP_CONNECTION) private readonly connection: ChannelModel,
    @Inject(AMQP_CHANNEL) private readonly channel: Channel,
  ) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel.close();
    } finally {
      await this.connection.close();
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: RABBITMQ_RUNTIME,
      useFactory: async (): Promise<RabbitMqRuntime> => {
        const connection = await connect(requiredEnv('RABBITMQ_URL'));
        try {
          const channel = await connection.createChannel();
          await declareMediaJobTopology(channel);
          new Logger(RabbitMqModule.name).log('MediaJob topology declared');
          return { connection, channel };
        } catch (error) {
          await connection.close();
          throw error;
        }
      },
    },
    {
      provide: AMQP_CONNECTION,
      inject: [RABBITMQ_RUNTIME],
      useFactory: (runtime: RabbitMqRuntime) => runtime.connection,
    },
    {
      provide: AMQP_CHANNEL,
      inject: [RABBITMQ_RUNTIME],
      useFactory: (runtime: RabbitMqRuntime) => runtime.channel,
    },
    RabbitMqShutdown,
  ],
  exports: [AMQP_CONNECTION, AMQP_CHANNEL],
})
export class RabbitMqModule {}
