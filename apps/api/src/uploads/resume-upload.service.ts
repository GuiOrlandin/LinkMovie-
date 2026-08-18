import { OBJECT_STORAGE, type ObjectStoragePort } from "@linkmovie/shared";
import { Inject, Injectable } from "@nestjs/common";
import { UploadSessionArchive } from "./archive/upload-session.archive";
import { requireInProgressSession } from "./require-in-progress-session";
import type { ResumeUploadResult } from "./types/resume-upload";

@Injectable()
export class ResumeUploadService {
  constructor(
    private readonly archive: UploadSessionArchive,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStoragePort,
  ) {}

  async execute(uploadToken: string): Promise<ResumeUploadResult> {
    const session = requireInProgressSession(
      await this.archive.findByUploadToken(uploadToken),
    );
    const parts = await this.objectStorage.listParts({
      key: session.objectKey,
      uploadId: session.uploadId,
    });

    return { parts };
  }
}
