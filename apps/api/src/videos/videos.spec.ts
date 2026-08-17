import {
  OBJECT_STORAGE,
  PrismaService,
  UploadSessionStatus,
  VideoStatus,
} from "@linkmovie/shared";
import type { ObjectStoragePort } from "@linkmovie/shared";
import { Global, INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { VideosModule } from "./videos.module";

const MIB = 1024 * 1024;
const GIB = 1024 * 1024 * 1024;

describe("POST /videos", () => {
  let app: INestApplication;
  let prisma: {
    video: { create: jest.Mock };
    uploadSession: { create: jest.Mock };
  };
  let objectStorage: Pick<ObjectStoragePort, "createMultipartUpload">;

  beforeEach(async () => {
    prisma = {
      video: { create: jest.fn() },
      uploadSession: { create: jest.fn() },
    };
    objectStorage = {
      createMultipartUpload: jest.fn(),
    };

    @Global()
    @Module({
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: OBJECT_STORAGE, useValue: objectStorage },
      ],
      exports: [PrismaService, OBJECT_STORAGE],
    })
    class TestDoublesModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [TestDoublesModule, VideosModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates an UPLOADING Video, IN_PROGRESS UploadSession, and starts multipart", async () => {
    prisma.video.create.mockResolvedValueOnce({ id: "video-1" });
    prisma.uploadSession.create.mockResolvedValueOnce({ id: "session-1" });
    (objectStorage.createMultipartUpload as jest.Mock).mockResolvedValueOnce({
      uploadId: "up-1",
      key: "videos/video-1/source.mp4",
    });

    const response = await request(app.getHttpServer())
      .post("/videos")
      .send({ contentType: "video/mp4", fileSizeBytes: 10 * MIB })
      .expect(201);

    expect(response.body).toEqual({
      videoId: "video-1",
      uploadToken: expect.any(String),
      uploadId: "up-1",
      objectKey: "videos/video-1/source.mp4",
      partSize: 5 * MIB,
    });
    expect(response.body.uploadToken).not.toBe("video-1");

    expect(prisma.video.create).toHaveBeenCalledWith({
      data: { status: VideoStatus.UPLOADING },
    });
    expect(objectStorage.createMultipartUpload).toHaveBeenCalledWith({
      key: "videos/video-1/source.mp4",
      contentType: "video/mp4",
    });
    expect(prisma.uploadSession.create).toHaveBeenCalledWith({
      data: {
        uploadToken: response.body.uploadToken,
        videoId: "video-1",
        status: UploadSessionStatus.IN_PROGRESS,
        uploadId: "up-1",
        objectKey: "videos/video-1/source.mp4",
        partSize: 5 * MIB,
      },
    });
  });

  it("rejects a content type other than video/mp4", async () => {
    await request(app.getHttpServer())
      .post("/videos")
      .send({ contentType: "video/webm", fileSizeBytes: 10 * MIB })
      .expect(400);

    expect(prisma.video.create).not.toHaveBeenCalled();
    expect(objectStorage.createMultipartUpload).not.toHaveBeenCalled();
  });

  it("rejects a source larger than 2 GiB", async () => {
    await request(app.getHttpServer())
      .post("/videos")
      .send({ contentType: "video/mp4", fileSizeBytes: 2 * GIB + 1 })
      .expect(400);

    expect(prisma.video.create).not.toHaveBeenCalled();
    expect(objectStorage.createMultipartUpload).not.toHaveBeenCalled();
  });
});
