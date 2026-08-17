import { Body, Controller, Post } from "@nestjs/common";
import { StartUploadService } from "../uploads/start-upload.service";
import type {
  StartUploadCommand,
  StartUploadResult,
} from "../uploads/types/start-upload";

@Controller("videos")
export class VideosController {
  constructor(private readonly startUpload: StartUploadService) {}

  @Post()
  start(@Body() body: StartUploadCommand): Promise<StartUploadResult> {
    return this.startUpload.execute(body ?? {});
  }
}
