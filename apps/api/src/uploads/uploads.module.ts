import { Module } from "@nestjs/common";
import { StartUploadArchive } from "./archive/start-upload.archive";
import { StartUploadService } from "./start-upload.service";

@Module({
  providers: [StartUploadArchive, StartUploadService],
  exports: [StartUploadService],
})
export class UploadsModule {}
