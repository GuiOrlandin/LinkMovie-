import { PrismaService } from "@linkmovie/shared";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadSessionArchive {
  constructor(private readonly prisma: PrismaService) {}

  async findByUploadToken(uploadToken: string) {
    return this.prisma.uploadSession.findUnique({
      where: { uploadToken },
    });
  }
}
