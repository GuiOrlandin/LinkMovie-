-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABORTED');

-- CreateEnum
CREATE TYPE "MediaJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MediaJobType" AS ENUM ('GenerateThumbnails', 'GenerateTitle');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL,
    "title" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "uploadToken" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "status" "UploadSessionStatus" NOT NULL,
    "uploadId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "partSize" INTEGER NOT NULL,
    "abortReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaJob" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "type" "MediaJobType" NOT NULL,
    "status" "MediaJobStatus" NOT NULL,
    "failureReason" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thumbnail" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "objectKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "positionPct" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLink" (
    "code" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_uploadToken_key" ON "UploadSession"("uploadToken");

-- CreateIndex
CREATE INDEX "UploadSession_videoId_idx" ON "UploadSession"("videoId");

-- CreateIndex
CREATE INDEX "UploadSession_status_idx" ON "UploadSession"("status");

-- CreateIndex
CREATE INDEX "MediaJob_videoId_idx" ON "MediaJob"("videoId");

-- CreateIndex
CREATE INDEX "MediaJob_status_idx" ON "MediaJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Thumbnail_videoId_ordinal_key" ON "Thumbnail"("videoId", "ordinal");

-- CreateIndex
CREATE INDEX "ShortLink_videoId_idx" ON "ShortLink"("videoId");

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaJob" ADD CONSTRAINT "MediaJob_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thumbnail" ADD CONSTRAINT "Thumbnail_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

