import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { S3ObjectStorage } from "./s3-object-storage";

describe("S3ObjectStorage (ObjectStoragePort)", () => {
  const bucket = "linkmovie";
  const send = jest.fn();
  const getSignedUrl = jest.fn();
  const client = { send } as never;

  let storage: S3ObjectStorage;

  beforeEach(() => {
    send.mockReset();
    getSignedUrl.mockReset();
    storage = new S3ObjectStorage({ client, bucket, getSignedUrl });
  });

  it("createMultipartUpload sends CreateMultipartUpload and returns uploadId + key", async () => {
    send.mockResolvedValueOnce({ UploadId: "up-1" });

    const result = await storage.createMultipartUpload({
      key: "videos/v1/source.mp4",
      contentType: "video/mp4",
    });

    expect(result).toEqual({ uploadId: "up-1", key: "videos/v1/source.mp4" });
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(CreateMultipartUploadCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/source.mp4",
      ContentType: "video/mp4",
    });
  });

  it("presignUploadPart signs UploadPart with partNumber and uploadId", async () => {
    getSignedUrl.mockResolvedValueOnce("https://minio/presigned-put");

    const url = await storage.presignUploadPart({
      key: "videos/v1/source.mp4",
      uploadId: "up-1",
      partNumber: 2,
      expiresInSeconds: 600,
    });

    expect(url).toBe("https://minio/presigned-put");
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
    const [, command, options] = getSignedUrl.mock.calls[0];
    expect(command).toBeInstanceOf(UploadPartCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/source.mp4",
      UploadId: "up-1",
      PartNumber: 2,
    });
    expect(options).toEqual({ expiresIn: 600 });
  });

  it("completeMultipartUpload maps ordered parts to CompleteMultipartUpload", async () => {
    send.mockResolvedValueOnce({});

    await storage.completeMultipartUpload({
      key: "videos/v1/source.mp4",
      uploadId: "up-1",
      parts: [
        { partNumber: 1, etag: '"etag-a"' },
        { partNumber: 2, etag: '"etag-b"' },
      ],
    });

    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(CompleteMultipartUploadCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/source.mp4",
      UploadId: "up-1",
      MultipartUpload: {
        Parts: [
          { PartNumber: 1, ETag: '"etag-a"' },
          { PartNumber: 2, ETag: '"etag-b"' },
        ],
      },
    });
  });

  it("abortMultipartUpload sends AbortMultipartUpload", async () => {
    send.mockResolvedValueOnce({});

    await storage.abortMultipartUpload({
      key: "videos/v1/source.mp4",
      uploadId: "up-1",
    });

    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(AbortMultipartUploadCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/source.mp4",
      UploadId: "up-1",
    });
  });

  it("listParts maps S3 Parts to ListedPart", async () => {
    send.mockResolvedValueOnce({
      Parts: [
        { PartNumber: 1, ETag: '"e1"', Size: 5_242_880 },
        { PartNumber: 3, ETag: '"e3"', Size: 100 },
      ],
    });

    const parts = await storage.listParts({
      key: "videos/v1/source.mp4",
      uploadId: "up-1",
    });

    expect(parts).toEqual([
      { partNumber: 1, etag: '"e1"', size: 5_242_880 },
      { partNumber: 3, etag: '"e3"', size: 100 },
    ]);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(ListPartsCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/source.mp4",
      UploadId: "up-1",
    });
  });

  it("getObject returns body stream and metadata", async () => {
    const body = Readable.from([Buffer.from("frame")]);
    send.mockResolvedValueOnce({
      Body: body,
      ContentType: "image/jpeg",
      ContentLength: 5,
    });

    const result = await storage.getObject({ key: "videos/v1/thumbs/0.jpg" });

    expect(result.body).toBe(body);
    expect(result.contentType).toBe("image/jpeg");
    expect(result.contentLength).toBe(5);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/thumbs/0.jpg",
    });
  });

  it("putObject sends PutObject with body and contentType", async () => {
    send.mockResolvedValueOnce({});
    const body = Buffer.from("jpeg-bytes");

    await storage.putObject({
      key: "videos/v1/thumbs/0.jpg",
      body,
      contentType: "image/jpeg",
    });

    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/thumbs/0.jpg",
      Body: body,
      ContentType: "image/jpeg",
    });
  });

  it("presignGetObject signs GetObjectCommand", async () => {
    getSignedUrl.mockResolvedValueOnce("https://minio/presigned-get");

    const url = await storage.presignGetObject({
      key: "videos/v1/source.mp4",
      expiresInSeconds: 120,
    });

    expect(url).toBe("https://minio/presigned-get");
    const [, command, options] = getSignedUrl.mock.calls[0];
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({
      Bucket: bucket,
      Key: "videos/v1/source.mp4",
    });
    expect(options).toEqual({ expiresIn: 120 });
  });
});
