import type { S3Client } from '@aws-sdk/client-s3';
import type { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** Wiring for tests / Nest DI — stays in infra (depends on AWS SDK). */
export type S3PresignFn = typeof getSignedUrl;

export type S3ObjectStorageDeps = {
  client: S3Client;
  bucket: string;
  getSignedUrl?: S3PresignFn;
};

/** Runtime config from env / Compose — no domain meaning. */
export type S3ObjectStorageConfig = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
};
