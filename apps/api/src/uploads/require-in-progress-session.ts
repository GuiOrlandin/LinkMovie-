import { UploadSessionStatus } from "@linkmovie/shared";
import { ConflictException, NotFoundException } from "@nestjs/common";

export function requireInProgressSession<T extends { status: string }>(
  session: T | null,
): T {
  if (!session) {
    throw new NotFoundException();
  }

  if (session.status !== UploadSessionStatus.IN_PROGRESS) {
    throw new ConflictException();
  }

  return session;
}
