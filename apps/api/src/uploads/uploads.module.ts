import { Module } from "@nestjs/common";
import { StartUploadArchive } from "./archive/start-upload.archive";
import { UploadSessionArchive } from "./archive/upload-session.archive";
import { PresignPartService } from "./presign-part.service";
import { ResumeUploadService } from "./resume-upload.service";
import { StartUploadService } from "./start-upload.service";
import { UploadsController } from "./uploads.controller";

@Module({
  controllers: [UploadsController],
  providers: [
    StartUploadArchive,
    StartUploadService,
    UploadSessionArchive,
    PresignPartService,
    ResumeUploadService,
  ],
  exports: [StartUploadService],
})
export class UploadsModule {}
