/** Marker export so apps can depend on the shared package at scaffold time. */
export const SHARED_PACKAGE = '@linkmovie/shared' as const;

export {
  MediaJobStatus,
  UploadSessionStatus,
  VideoStatus,
  asMediaJobId,
  asUploadToken,
  asVideoId,
  type MediaJobId,
  type UploadToken,
  type VideoId,
} from './domain';

export { PrismaClient, type Prisma } from './archive/prisma';

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
} from './ports/object-storage';

export {
  createS3Client,
  createS3ObjectStorage,
  S3ObjectStorage,
} from './infra/s3/s3-object-storage';

export type {
  S3ObjectStorageConfig,
  S3ObjectStorageDeps,
  S3PresignFn,
} from './infra/s3/types';
