import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { PresignPartService } from "./presign-part.service";
import { ResumeUploadService } from "./resume-upload.service";
import type {
  PresignPartCommand,
  PresignPartResult,
} from "./types/presign-part";
import type { ResumeUploadResult } from "./types/resume-upload";

@Controller("uploads")
export class UploadsController {
  constructor(
    private readonly presignPart: PresignPartService,
    private readonly resumeUpload: ResumeUploadService,
  ) {}

  @Post(":token/parts")
  @HttpCode(200)
  presign(
    @Param("token") token: string,
    @Body() body: PresignPartCommand,
  ): Promise<PresignPartResult> {
    return this.presignPart.execute(token, body ?? {});
  }

  @Get(":token")
  resume(@Param("token") token: string): Promise<ResumeUploadResult> {
    return this.resumeUpload.execute(token);
  }
}
