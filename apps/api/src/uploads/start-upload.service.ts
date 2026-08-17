import {
  OBJECT_STORAGE,
  UploadSessionStatus,
  partSize,
  type ObjectStoragePort,
} from "@linkmovie/shared";
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { StartUploadArchive } from "./archive/start-upload.archive";
import {
  ALLOWED_UPLOAD_CONTENT_TYPE,
  MAX_SOURCE_OBJECT_BYTES,
  type StartUploadCommand,
  type StartUploadResult,
} from "./types/start-upload";

@Injectable()
export class StartUploadService {
  private readonly logger = new Logger(StartUploadService.name);

  constructor(
    private readonly archive: StartUploadArchive,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStoragePort,
  ) {}

  async execute(command: StartUploadCommand): Promise<StartUploadResult> {
    const fileSizeBytes = this.assertAllowedUpload(command);
    const chosenPartSize = partSize(fileSizeBytes);
    const video = await this.archive.createUploadingVideo();
    const objectKey = `videos/${video.id}/source.mp4`;
    const uploadToken = randomUUID();

    let uploadId: string;
    try {
      const multipart = await this.objectStorage.createMultipartUpload({
        key: objectKey,
        contentType: ALLOWED_UPLOAD_CONTENT_TYPE,
      });
      uploadId = multipart.uploadId;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: "upload_session.failed",
          videoId: video.id,
          uploadToken,
          status: UploadSessionStatus.IN_PROGRESS,
        }),
      );
      throw error;
    }

    await this.archive.createInProgressSession({
      uploadToken,
      videoId: video.id,
      uploadId,
      objectKey,
      partSize: chosenPartSize,
    });

    this.logger.log(
      JSON.stringify({
        event: "upload_session.created",
        videoId: video.id,
        uploadToken,
        status: UploadSessionStatus.IN_PROGRESS,
        uploadId,
      }),
    );

    return {
      videoId: video.id,
      uploadToken,
      uploadId,
      objectKey,
      partSize: chosenPartSize,
    };
  }

  private assertAllowedUpload(command: StartUploadCommand): number {
    if (command.contentType !== ALLOWED_UPLOAD_CONTENT_TYPE) {
      throw new BadRequestException("contentType must be video/mp4");
    }

    const fileSizeBytes = command.fileSizeBytes;
    if (
      typeof fileSizeBytes !== "number" ||
      !Number.isInteger(fileSizeBytes) ||
      fileSizeBytes < 1 ||
      fileSizeBytes > MAX_SOURCE_OBJECT_BYTES
    ) {
      throw new BadRequestException("fileSizeBytes exceeds the 2 GiB limit");
    }

    return fileSizeBytes;
  }
}
