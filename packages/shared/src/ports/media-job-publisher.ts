import type { MediaJobId, VideoId } from '../domain';

/** Wire `type` values in the MediaJob message body. */
export type MediaJobMessageType = 'GenerateThumbnails' | 'GenerateTitle';

export type PublishMediaJobInput = {
  mediaJobId: MediaJobId;
  videoId: VideoId;
  type: MediaJobMessageType;
};

/** Api publishes MediaJobs; Worker does not use this port to consume. */
export interface MediaJobPublisherPort {
  publish(input: PublishMediaJobInput): Promise<void>;
}
