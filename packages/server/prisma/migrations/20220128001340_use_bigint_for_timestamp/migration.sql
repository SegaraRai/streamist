/*
  Warnings:

  - You are about to alter the column `createdAt` on the `Album` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `Album` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `AlbumCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `AlbumCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `Artist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `Artist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `deletedAt` on the `Deletion` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `Image` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `Image` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `ImageFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `ImageFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `Playlist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `Playlist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `ResourceUpdate` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `transcodeStartedAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `transcodeFinishedAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `uploadedAt` on the `SourceFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `SourceFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `SourceFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `TrackCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `TrackCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `TrackFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `TrackFile` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `closedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `createdAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `updatedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Album" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "AlbumCoArtist" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Artist" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Deletion" ALTER COLUMN "deletedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Image" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "ImageFile" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Playlist" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "ResourceUpdate" ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Source" ALTER COLUMN "transcodeStartedAt" SET DATA TYPE BIGINT,
ALTER COLUMN "transcodeFinishedAt" SET DATA TYPE BIGINT,
ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "SourceFile" ALTER COLUMN "uploadedAt" SET DATA TYPE BIGINT,
ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Track" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "TrackCoArtist" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "TrackFile" ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "closedAt" SET DATA TYPE BIGINT,
ALTER COLUMN "createdAt" SET DATA TYPE BIGINT,
ALTER COLUMN "updatedAt" SET DATA TYPE BIGINT;
