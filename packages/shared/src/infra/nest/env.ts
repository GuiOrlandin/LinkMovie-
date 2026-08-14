import type { S3ObjectStorageConfig } from '../s3/types';

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function readS3ObjectStorageConfig(): S3ObjectStorageConfig {
  const forcePathStyleRaw = process.env.S3_FORCE_PATH_STYLE;
  return {
    endpoint: requiredEnv('S3_ENDPOINT'),
    region: requiredEnv('S3_REGION'),
    accessKeyId: requiredEnv('S3_ACCESS_KEY'),
    secretAccessKey: requiredEnv('S3_SECRET_KEY'),
    bucket: requiredEnv('S3_BUCKET'),
    forcePathStyle: forcePathStyleRaw === undefined ? true : forcePathStyleRaw === 'true',
  };
}
