import { Module } from "@nestjs/common";
import { UploadsModule } from "../uploads/uploads.module";
import { VideosController } from "./videos.controller";

@Module({
  imports: [UploadsModule],
  controllers: [VideosController],
})
export class VideosModule {}
