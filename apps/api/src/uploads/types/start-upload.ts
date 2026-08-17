export const ALLOWED_UPLOAD_CONTENT_TYPE = "video/mp4";
export const MAX_SOURCE_OBJECT_BYTES = 2 * 1024 * 1024 * 1024;

export type StartUploadCommand = {
  contentType?: string;
  fileSizeBytes?: number;
};

export type StartUploadResult = {
  videoId: string;
  uploadToken: string;
  uploadId: string;
  objectKey: string;
  partSize: number;
};
