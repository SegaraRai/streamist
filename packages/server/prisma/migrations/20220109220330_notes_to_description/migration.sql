/*
  Warnings:

  - You are about to drop the column `notes` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Album` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT '',
    "trackOrder" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("createdAt", "id", "imageOrder", "title", "trackOrder", "updatedAt", "userId") SELECT "createdAt", "id", "imageOrder", "title", "trackOrder", "updatedAt", "userId" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE INDEX "Playlist_userId_idx" ON "Playlist"("userId");
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "replayGainGain" REAL,
    "replayGainPeak" REAL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Album" ("artistId", "createdAt", "id", "imageOrder", "replayGainGain", "replayGainPeak", "title", "titleSort", "updatedAt", "userId") SELECT "artistId", "createdAt", "id", "imageOrder", "replayGainGain", "replayGainPeak", "title", "titleSort", "updatedAt", "userId" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE INDEX "Album_userId_idx" ON "Album"("userId");
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;