import { asMediaJobId, asVideoId } from '../../domain';
import { AmqpMediaJobPublisher } from './media-job-publisher';
import { MEDIA_JOBS_EXCHANGE, MEDIA_JOB_ROUTING_KEYS } from './topology';

describe('AmqpMediaJobPublisher (MediaJobPublisherPort)', () => {
  const publish = jest.fn();
  const channel = { publish };

  let publisher: AmqpMediaJobPublisher;

  beforeEach(() => {
    publish.mockReset().mockReturnValue(true);
    publisher = new AmqpMediaJobPublisher({ channel: channel as never });
  });

  it('publishes JSON { mediaJobId, videoId, type } to the thumbs routing key', async () => {
    const mediaJobId = asMediaJobId('job-1');
    const videoId = asVideoId('video-1');

    await publisher.publish({
      mediaJobId,
      videoId,
      type: 'GenerateThumbnails',
    });

    expect(publish).toHaveBeenCalledTimes(1);
    const [exchange, routingKey, content, options] = publish.mock.calls[0];
    expect(exchange).toBe(MEDIA_JOBS_EXCHANGE);
    expect(routingKey).toBe(MEDIA_JOB_ROUTING_KEYS.GenerateThumbnails);
    expect(JSON.parse(content.toString('utf8'))).toEqual({
      mediaJobId: 'job-1',
      videoId: 'video-1',
      type: 'GenerateThumbnails',
    });
    expect(options).toMatchObject({
      persistent: true,
      contentType: 'application/json',
    });
  });

  it('routes GenerateTitle to the title routing key', async () => {
    await publisher.publish({
      mediaJobId: asMediaJobId('job-2'),
      videoId: asVideoId('video-2'),
      type: 'GenerateTitle',
    });

    const [, routingKey, content] = publish.mock.calls[0];
    expect(routingKey).toBe(MEDIA_JOB_ROUTING_KEYS.GenerateTitle);
    expect(JSON.parse(content.toString('utf8')).type).toBe('GenerateTitle');
  });
});
