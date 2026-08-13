import {
  MEDIA_JOBS_DLX,
  MEDIA_JOBS_EXCHANGE,
  MEDIA_JOB_QUEUES,
  MEDIA_JOB_ROUTING_KEYS,
  declareMediaJobTopology,
} from './topology';

describe('declareMediaJobTopology', () => {
  const channel = {
    assertExchange: jest.fn(),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
  };

  beforeEach(() => {
    channel.assertExchange.mockReset().mockResolvedValue(undefined);
    channel.assertQueue.mockReset().mockResolvedValue(undefined);
    channel.bindQueue.mockReset().mockResolvedValue(undefined);
  });

  it('declares ADR 0005 exchanges, queues, DLX/DLQs and bindings', async () => {
    await declareMediaJobTopology(channel as never);

    expect(channel.assertExchange).toHaveBeenCalledWith(MEDIA_JOBS_EXCHANGE, 'direct', {
      durable: true,
    });
    expect(channel.assertExchange).toHaveBeenCalledWith(MEDIA_JOBS_DLX, 'direct', {
      durable: true,
    });

    expect(MEDIA_JOBS_EXCHANGE).toBe('media.jobs');
    expect(MEDIA_JOBS_DLX).toBe('media.jobs.dlx');
    expect(MEDIA_JOB_ROUTING_KEYS.GenerateThumbnails).toBe('media.job.generate-thumbnails');
    expect(MEDIA_JOB_ROUTING_KEYS.GenerateTitle).toBe('media.job.generate-title');
    expect(MEDIA_JOB_QUEUES.GenerateThumbnails).toBe('q.media.generate-thumbnails');
    expect(MEDIA_JOB_QUEUES.GenerateTitle).toBe('q.media.generate-title');
    expect(MEDIA_JOB_QUEUES.GenerateThumbnailsDlq).toBe('q.media.generate-thumbnails.dlq');
    expect(MEDIA_JOB_QUEUES.GenerateTitleDlq).toBe('q.media.generate-title.dlq');

    expect(channel.assertQueue).toHaveBeenCalledWith(MEDIA_JOB_QUEUES.GenerateThumbnailsDlq, {
      durable: true,
    });
    expect(channel.assertQueue).toHaveBeenCalledWith(MEDIA_JOB_QUEUES.GenerateTitleDlq, {
      durable: true,
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      MEDIA_JOB_QUEUES.GenerateThumbnailsDlq,
      MEDIA_JOBS_DLX,
      MEDIA_JOB_ROUTING_KEYS.GenerateThumbnails,
    );
    expect(channel.bindQueue).toHaveBeenCalledWith(
      MEDIA_JOB_QUEUES.GenerateTitleDlq,
      MEDIA_JOBS_DLX,
      MEDIA_JOB_ROUTING_KEYS.GenerateTitle,
    );

    expect(channel.assertQueue).toHaveBeenCalledWith(MEDIA_JOB_QUEUES.GenerateThumbnails, {
      durable: true,
      deadLetterExchange: MEDIA_JOBS_DLX,
    });
    expect(channel.assertQueue).toHaveBeenCalledWith(MEDIA_JOB_QUEUES.GenerateTitle, {
      durable: true,
      deadLetterExchange: MEDIA_JOBS_DLX,
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      MEDIA_JOB_QUEUES.GenerateThumbnails,
      MEDIA_JOBS_EXCHANGE,
      MEDIA_JOB_ROUTING_KEYS.GenerateThumbnails,
    );
    expect(channel.bindQueue).toHaveBeenCalledWith(
      MEDIA_JOB_QUEUES.GenerateTitle,
      MEDIA_JOBS_EXCHANGE,
      MEDIA_JOB_ROUTING_KEYS.GenerateTitle,
    );
  });
});
