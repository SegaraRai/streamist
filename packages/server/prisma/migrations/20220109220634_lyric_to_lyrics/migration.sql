/*
  Warnings:

  - You are about to drop the column `lyric` on the `Track` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "discNumber" INTEGER NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "duration" REAL NOT NULL,
    "comment" TEXT,
    "lyrics" TEXT,
    "releaseDate" TEXT,
    "releaseDatePrecision" TEXT,
    "releaseDateText" TEXT,
    "genre" TEXT,
    "bpm" INTEGER,
    "replayGainGain" REAL,
    "replayGainPeak" REAL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("albumId", "artistId", "bpm", "comment", "createdAt", "discNumber", "duration", "genre", "id", "releaseDate", "releaseDatePrecision", "releaseDateText", "replayGainGain", "replayGainPeak", "sourceFileId", "title", "titleSort", "trackNumber", "updatedAt", "userId") SELECT "albumId", "artistId", "bpm", "comment", "createdAt", "discNumber", "duration", "genre", "id", "releaseDate", "releaseDatePrecision", "releaseDateText", "replayGainGain", "replayGainPeak", "sourceFileId", "title", "titleSort", "trackNumber", "updatedAt", "userId" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_userId_idx" ON "Track"("userId");
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
