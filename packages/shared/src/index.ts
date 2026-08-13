/** Marker export so apps can depend on the shared package at scaffold time. */
export const SHARED_PACKAGE = "@linkmovie/shared" as const;

export {
  asMediaJobId,
  asUploadToken,
  asVideoId,
  MediaJobStatus,
  UploadSessionStatus,
  VideoStatus,
  type MediaJobId,
  type UploadToken,
  type VideoId,
} from "./domain";

export { PrismaClient, type Prisma } from "./archive/prisma";

export type {
  CompletedPart,
  CompleteMultipartUploadInput,
  CreateMultipartUploadInput,
  CreateMultipartUploadResult,
  GetObjectResult,
  ListedPart,
  MultipartUploadRef,
  ObjectStoragePort,
  PresignGetObjectInput,
  PresignUploadPartInput,
  PutObjectInput,
} from "./ports/object-storage";

export {
  createS3Client,
  createS3ObjectStorage,
  S3ObjectStorage,
} from "./infra/s3/s3-object-storage";

export type {
  S3ObjectStorageConfig,
  S3ObjectStorageDeps,
  S3PresignFn,
} from "./infra/s3/types";

export type {
  MediaJobMessageType,
  MediaJobPublisherPort,
  PublishMediaJobInput,
} from "./ports/media-job-publisher";

export {
  declareMediaJobTopology,
  MEDIA_JOB_QUEUES,
  MEDIA_JOB_ROUTING_KEYS,
  MEDIA_JOBS_DLX,
  MEDIA_JOBS_EXCHANGE,
} from "./infra/rabbitmq/topology";

export { AmqpMediaJobPublisher } from "./infra/rabbitmq/media-job-publisher";

export type { AmqpMediaJobPublisherDeps } from "./infra/rabbitmq/types";
