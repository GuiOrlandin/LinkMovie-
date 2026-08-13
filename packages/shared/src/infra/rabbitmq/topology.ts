import type { Channel } from 'amqplib';
import type { MediaJobMessageType } from '../../ports/media-job-publisher';

/** Direct exchange that routes MediaJobs by type. */
export const MEDIA_JOBS_EXCHANGE = 'media.jobs' as const;

/** Dead-letter exchange when a job is rejected without requeue. */
export const MEDIA_JOBS_DLX = 'media.jobs.dlx' as const;

export const MEDIA_JOB_ROUTING_KEYS = {
  GenerateThumbnails: 'media.job.generate-thumbnails',
  GenerateTitle: 'media.job.generate-title',
} as const satisfies Record<MediaJobMessageType, string>;

export const MEDIA_JOB_QUEUES = {
  GenerateThumbnails: 'q.media.generate-thumbnails',
  GenerateTitle: 'q.media.generate-title',
  GenerateThumbnailsDlq: 'q.media.generate-thumbnails.dlq',
  GenerateTitleDlq: 'q.media.generate-title.dlq',
} as const;

/**
 * Idempotent declare of exchange/queues/DLX used by Api and Worker on boot.
 * DLQs bind with the same routing keys so dead-lettered messages stay per type.
 */
export async function declareMediaJobTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(MEDIA_JOBS_EXCHANGE, 'direct', { durable: true });
  await channel.assertExchange(MEDIA_JOBS_DLX, 'direct', { durable: true });

  await channel.assertQueue(MEDIA_JOB_QUEUES.GenerateThumbnailsDlq, { durable: true });
  await channel.assertQueue(MEDIA_JOB_QUEUES.GenerateTitleDlq, { durable: true });
  await channel.bindQueue(
    MEDIA_JOB_QUEUES.GenerateThumbnailsDlq,
    MEDIA_JOBS_DLX,
    MEDIA_JOB_ROUTING_KEYS.GenerateThumbnails,
  );
  await channel.bindQueue(
    MEDIA_JOB_QUEUES.GenerateTitleDlq,
    MEDIA_JOBS_DLX,
    MEDIA_JOB_ROUTING_KEYS.GenerateTitle,
  );

  await channel.assertQueue(MEDIA_JOB_QUEUES.GenerateThumbnails, {
    durable: true,
    deadLetterExchange: MEDIA_JOBS_DLX,
  });
  await channel.assertQueue(MEDIA_JOB_QUEUES.GenerateTitle, {
    durable: true,
    deadLetterExchange: MEDIA_JOBS_DLX,
  });
  await channel.bindQueue(
    MEDIA_JOB_QUEUES.GenerateThumbnails,
    MEDIA_JOBS_EXCHANGE,
    MEDIA_JOB_ROUTING_KEYS.GenerateThumbnails,
  );
  await channel.bindQueue(
    MEDIA_JOB_QUEUES.GenerateTitle,
    MEDIA_JOBS_EXCHANGE,
    MEDIA_JOB_ROUTING_KEYS.GenerateTitle,
  );
}
