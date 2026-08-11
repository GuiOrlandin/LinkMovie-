import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl as defaultGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'node:stream';
import type {
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
} from '../../ports/object-storage';
import type {
  S3ObjectStorageConfig,
  S3ObjectStorageDeps,
  S3PresignFn,
} from './types';

export type { S3ObjectStorageConfig, S3ObjectStorageDeps, S3PresignFn } from './types';

const DEFAULT_PRESIGN_EXPIRES_IN_SECONDS = 900;

export function createS3Client(config: Omit<S3ObjectStorageConfig, 'bucket'>): S3Client {
  const clientConfig: S3ClientConfig = {
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle ?? true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };
  return new S3Client(clientConfig);
}

export function createS3ObjectStorage(config: S3ObjectStorageConfig): S3ObjectStorage {
  return new S3ObjectStorage({
    client: createS3Client(config),
    bucket: config.bucket,
  });
}

export class S3ObjectStorage implements ObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly getSignedUrl: S3PresignFn;

  constructor(deps: S3ObjectStorageDeps) {
    this.client = deps.client;
    this.bucket = deps.bucket;
    this.getSignedUrl = deps.getSignedUrl ?? defaultGetSignedUrl;
  }

  async createMultipartUpload(
    input: CreateMultipartUploadInput,
  ): Promise<CreateMultipartUploadResult> {
    const result = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.key,
        ContentType: input.contentType,
      }),
    );

    if (!result.UploadId) {
      throw new Error('CreateMultipartUpload did not return UploadId');
    }

    return { uploadId: result.UploadId, key: input.key };
  }

  async presignUploadPart(input: PresignUploadPartInput): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: input.key,
      UploadId: input.uploadId,
      PartNumber: input.partNumber,
    });

    return this.getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? DEFAULT_PRESIGN_EXPIRES_IN_SECONDS,
    });
  }

  async completeMultipartUpload(input: CompleteMultipartUploadInput): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.key,
        UploadId: input.uploadId,
        MultipartUpload: {
          Parts: input.parts.map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
        },
      }),
    );
  }

  async abortMultipartUpload(input: MultipartUploadRef): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: input.key,
        UploadId: input.uploadId,
      }),
    );
  }

  async listParts(input: MultipartUploadRef): Promise<ListedPart[]> {
    const result = await this.client.send(
      new ListPartsCommand({
        Bucket: this.bucket,
        Key: input.key,
        UploadId: input.uploadId,
      }),
    );

    return (result.Parts ?? []).map((part) => ({
      partNumber: part.PartNumber!,
      etag: part.ETag!,
      size: part.Size,
    }));
  }

  async getObject(input: { key: string }): Promise<GetObjectResult> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
      }),
    );

    if (!result.Body) {
      throw new Error(`GetObject returned empty body for key ${input.key}`);
    }

    return {
      body: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async presignGetObject(input: PresignGetObjectInput): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
    });

    return this.getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds ?? DEFAULT_PRESIGN_EXPIRES_IN_SECONDS,
    });
  }
}
