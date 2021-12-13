/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Track` table. All the data in the column will be lost.
  - Added the required column `sourceFileId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceFileId` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;

ALTER TABLE "Image" ADD COLUMN "sourceFileId" TEXT;
UPDATE "Image" AS A SET "sourceFileId" = B."id" FROM "SourceFile" AS B WHERE A."sourceId" = B."sourceId";

ALTER TABLE "Track" ADD COLUMN "sourceFileId" TEXT;
UPDATE "Track" AS A SET "sourceFileId" = B."id" FROM "SourceFile" AS B WHERE A."sourceId" = B."sourceId";

CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceWidth" INTEGER NOT NULL,
    "sourceHeight" INTEGER NOT NULL,
    "dHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Image_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "dHash", "id", "sourceHeight", "sourceWidth", "updatedAt", "sourceFileId", "userId")
SELECT "createdAt", "dHash", "id", "sourceHeight", "sourceWidth", "updatedAt", "sourceFileId", "userId" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE INDEX "Image_userId_idx" ON "Image"("userId");
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "discNumber" INTEGER NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "duration" REAL NOT NULL,
    "comment" TEXT,
    "lyric" TEXT,
    "releaseDate" TEXT,
    "releaseDatePrecision" TEXT,
    "releaseDateText" TEXT,
    "genre" TEXT,
    "bpm" INTEGER,
    "replayGainGain" REAL,
    "replayGainPeak" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("albumId", "artistId", "bpm", "comment", "createdAt", "discNumber", "duration", "genre", "id", "lyric", "releaseDate", "releaseDatePrecision", "releaseDateText", "replayGainGain", "replayGainPeak", "title", "titleSort", "trackNumber", "updatedAt", "sourceFileId", "userId")
SELECT "albumId", "artistId", "bpm", "comment", "createdAt", "discNumber", "duration", "genre", "id", "lyric", "releaseDate", "releaseDatePrecision", "releaseDateText", "replayGainGain", "replayGainPeak", "title", "titleSort", "trackNumber", "updatedAt", "sourceFileId", "userId" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_userId_idx" ON "Track"("userId");
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
