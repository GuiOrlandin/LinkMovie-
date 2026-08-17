import { OBJECT_STORAGE, type ObjectStoragePort } from "@linkmovie/shared";
import { Inject, Injectable } from "@nestjs/common";
import { UploadSessionArchive } from "./archive/upload-session.archive";
import { requireInProgressSession } from "./require-in-progress-session";
import type {
  PresignPartCommand,
  PresignPartResult,
} from "./types/presign-part";

@Injectable()
export class PresignPartService {
  constructor(
    private readonly archive: UploadSessionArchive,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStoragePort,
  ) {}

  async execute(
    uploadToken: string,
    command: PresignPartCommand,
  ): Promise<PresignPartResult> {
    const session = requireInProgressSession(
      await this.archive.findByUploadToken(uploadToken),
    );
    const url = await this.objectStorage.presignUploadPart({
      key: session.objectKey,
      uploadId: session.uploadId,
      partNumber: command.partNumber,
    });

    return {
      url,
      partNumber: command.partNumber,
      uploadId: session.uploadId,
    };
  }
}
