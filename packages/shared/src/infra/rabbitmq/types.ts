import type { Channel } from 'amqplib';

export type AmqpMediaJobPublisherDeps = {
  channel: Channel;
};
