import type { Readable } from 'node:stream';

export type CompletedPart = {
  partNumber: number;
  etag: string;
};

export type ListedPart = {
  partNumber: number;
  etag: string;
  size?: number;
};

export type CreateMultipartUploadInput = {
  key: string;
  contentType?: string;
};

export type CreateMultipartUploadResult = {
  uploadId: string;
  key: string;
};

export type PresignUploadPartInput = {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresInSeconds?: number;
};

export type MultipartUploadRef = {
  key: string;
  uploadId: string;
};

export type CompleteMultipartUploadInput = MultipartUploadRef & {
  parts: CompletedPart[];
};

export type GetObjectResult = {
  body: Readable;
  contentType?: string;
  contentLength?: number;
};

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array | Readable;
  contentType?: string;
};

export type PresignGetObjectInput = {
  key: string;
  expiresInSeconds?: number;
};

/** S3/MinIO operations used by Api (multipart + presign) and Worker (get/put). */
export interface ObjectStoragePort {
  createMultipartUpload(
    input: CreateMultipartUploadInput,
  ): Promise<CreateMultipartUploadResult>;

  presignUploadPart(input: PresignUploadPartInput): Promise<string>;

  completeMultipartUpload(input: CompleteMultipartUploadInput): Promise<void>;

  abortMultipartUpload(input: MultipartUploadRef): Promise<void>;

  listParts(input: MultipartUploadRef): Promise<ListedPart[]>;

  getObject(input: { key: string }): Promise<GetObjectResult>;

  putObject(input: PutObjectInput): Promise<void>;

  presignGetObject(input: PresignGetObjectInput): Promise<string>;
}
