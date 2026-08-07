/** Marker export so apps can depend on the shared package at scaffold time. */
export const SHARED_PACKAGE = '@linkmovie/shared' as const;

export {
  MediaJobStatus,
  UploadSessionStatus,
  VideoStatus,
  asMediaJobId,
  asUploadToken,
  asVideoId,
  type MediaJobId,
  type UploadToken,
  type VideoId,
} from './domain';

export { PrismaClient, type Prisma } from './archive/prisma';
