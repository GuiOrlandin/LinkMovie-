import type { Channel } from 'amqplib';
import type {
  MediaJobPublisherPort,
  PublishMediaJobInput,
} from '../../ports/media-job-publisher';
import { MEDIA_JOBS_EXCHANGE, MEDIA_JOB_ROUTING_KEYS } from './topology';
import type { AmqpMediaJobPublisherDeps } from './types';

export type { AmqpMediaJobPublisherDeps } from './types';

export class AmqpMediaJobPublisher implements MediaJobPublisherPort {
  private readonly channel: Channel;

  constructor(deps: AmqpMediaJobPublisherDeps) {
    this.channel = deps.channel;
  }

  async publish(input: PublishMediaJobInput): Promise<void> {
    const routingKey = MEDIA_JOB_ROUTING_KEYS[input.type];
    const body = Buffer.from(
      JSON.stringify({
        mediaJobId: input.mediaJobId,
        videoId: input.videoId,
        type: input.type,
      }),
      'utf8',
    );

    const ok = this.channel.publish(MEDIA_JOBS_EXCHANGE, routingKey, body, {
      persistent: true,
      contentType: 'application/json',
    });

    if (!ok) {
      throw new Error(`Failed to publish MediaJob ${input.mediaJobId} (channel buffer full)`);
    }
  }
}
