import {
  PrismaService,
  UploadSessionStatus,
  VideoStatus,
} from "@linkmovie/shared";
import { Injectable } from "@nestjs/common";

@Injectable()
export class StartUploadArchive {
  constructor(private readonly prisma: PrismaService) {}

  async createUploadingVideo(): Promise<{ id: string }> {
    const video = await this.prisma.video.create({
      data: { status: VideoStatus.UPLOADING },
    });
    return { id: video.id };
  }

  async createInProgressSession(input: {
    uploadToken: string;
    videoId: string;
    uploadId: string;
    objectKey: string;
    partSize: number;
  }): Promise<void> {
    await this.prisma.uploadSession.create({
      data: {
        uploadToken: input.uploadToken,
        videoId: input.videoId,
        status: UploadSessionStatus.IN_PROGRESS,
        uploadId: input.uploadId,
        objectKey: input.objectKey,
        partSize: input.partSize,
      },
    });
  }
}
