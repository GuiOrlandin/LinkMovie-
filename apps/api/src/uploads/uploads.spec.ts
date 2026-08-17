import {
  OBJECT_STORAGE,
  PrismaService,
  UploadSessionStatus,
} from "@linkmovie/shared";
import type { ObjectStoragePort } from "@linkmovie/shared";
import { Global, INestApplication, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { UploadsModule } from "./uploads.module";

const MIB = 1024 * 1024;

const inProgressSession = {
  id: "session-1",
  uploadToken: "token-1",
  videoId: "video-1",
  status: UploadSessionStatus.IN_PROGRESS,
  uploadId: "up-1",
  objectKey: "videos/video-1/source.mp4",
  partSize: 5 * MIB,
};

describe("uploads by token", () => {
  let app: INestApplication;
  let prisma: {
    uploadSession: { findUnique: jest.Mock };
  };
  let objectStorage: Pick<ObjectStoragePort, "presignUploadPart" | "listParts">;

  beforeEach(async () => {
    prisma = {
      uploadSession: { findUnique: jest.fn() },
    };
    objectStorage = {
      presignUploadPart: jest.fn(),
      listParts: jest.fn(),
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
      imports: [TestDoublesModule, UploadsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("presigns a PUT URL for partNumber and the session uploadId", async () => {
    prisma.uploadSession.findUnique.mockResolvedValueOnce(inProgressSession);
    (objectStorage.presignUploadPart as jest.Mock).mockResolvedValueOnce(
      "https://minio/presigned-put",
    );

    const response = await request(app.getHttpServer())
      .post("/uploads/token-1/parts")
      .send({ partNumber: 2 })
      .expect(200);

    expect(response.body).toEqual({
      url: "https://minio/presigned-put",
      partNumber: 2,
      uploadId: "up-1",
    });
    expect(prisma.uploadSession.findUnique).toHaveBeenCalledWith({
      where: { uploadToken: "token-1" },
    });
    expect(objectStorage.presignUploadPart).toHaveBeenCalledWith({
      key: "videos/video-1/source.mp4",
      uploadId: "up-1",
      partNumber: 2,
    });
  });

  it("maps ListParts onto the resume payload", async () => {
    prisma.uploadSession.findUnique.mockResolvedValueOnce(inProgressSession);
    (objectStorage.listParts as jest.Mock).mockResolvedValueOnce([
      { partNumber: 1, etag: '"e1"', size: 5 * MIB },
      { partNumber: 3, etag: '"e3"', size: 100 },
    ]);

    const response = await request(app.getHttpServer())
      .get("/uploads/token-1")
      .expect(200);

    expect(response.body).toEqual({
      parts: [
        { partNumber: 1, etag: '"e1"', size: 5 * MIB },
        { partNumber: 3, etag: '"e3"', size: 100 },
      ],
    });
    expect(objectStorage.listParts).toHaveBeenCalledWith({
      key: "videos/video-1/source.mp4",
      uploadId: "up-1",
    });
  });

  it("returns 404 for an unknown upload token", async () => {
    prisma.uploadSession.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer()).get("/uploads/missing-token").expect(404);
    await request(app.getHttpServer())
      .post("/uploads/missing-token/parts")
      .send({ partNumber: 1 })
      .expect(404);

    expect(prisma.uploadSession.findUnique).toHaveBeenCalled();
    expect(objectStorage.presignUploadPart).not.toHaveBeenCalled();
    expect(objectStorage.listParts).not.toHaveBeenCalled();
  });

  it("returns 409 for an ABORTED upload token", async () => {
    prisma.uploadSession.findUnique.mockResolvedValue({
      ...inProgressSession,
      status: UploadSessionStatus.ABORTED,
    });

    await request(app.getHttpServer()).get("/uploads/token-1").expect(409);
    await request(app.getHttpServer())
      .post("/uploads/token-1/parts")
      .send({ partNumber: 1 })
      .expect(409);

    expect(objectStorage.presignUploadPart).not.toHaveBeenCalled();
    expect(objectStorage.listParts).not.toHaveBeenCalled();
  });
});
