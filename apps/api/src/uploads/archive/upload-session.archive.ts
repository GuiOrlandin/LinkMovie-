import { PrismaService, type UploadSession } from "@linkmovie/shared";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadSessionArchive {
  constructor(private readonly prisma: PrismaService) {}

  async findByUploadToken(
    uploadToken: string,
  ): Promise<UploadSession | null> {
    return this.prisma.uploadSession.findUnique({
      where: { uploadToken },
    });
  }
}
