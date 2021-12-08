/*
  Warnings:

  - You are about to drop the `AlbumImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlaylistTrack` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `trackOrder` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageOrder` to the `Album` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AlbumImage_nextImageId_idx";

-- DropIndex
DROP INDEX "AlbumImage_imageId_idx";

-- DropIndex
DROP INDEX "AlbumImage_albumId_idx";

-- DropIndex
DROP INDEX "AlbumImage_userId_idx";

-- DropIndex
DROP INDEX "PlaylistTrack_nextTrackId_idx";

-- DropIndex
DROP INDEX "PlaylistTrack_trackId_idx";

-- DropIndex
DROP INDEX "PlaylistTrack_playlistId_idx";

-- DropIndex
DROP INDEX "PlaylistTrack_userId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AlbumImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlaylistTrack";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_AlbumToImage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlaylistToTrack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "trackOrder" TEXT NOT NULL,
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("createdAt", "id", "notes", "title", "updatedAt", "userId") SELECT "createdAt", "id", "notes", "title", "updatedAt", "userId" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE INDEX "Playlist_userId_idx" ON "Playlist"("userId");
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "replayGainGain" REAL,
    "replayGainPeak" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL,
    CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Album" ("artistId", "createdAt", "id", "notes", "replayGainGain", "replayGainPeak", "title", "titleSort", "updatedAt", "userId") SELECT "artistId", "createdAt", "id", "notes", "replayGainGain", "replayGainPeak", "title", "titleSort", "updatedAt", "userId" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE INDEX "Album_userId_idx" ON "Album"("userId");
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToImage_AB_unique" ON "_AlbumToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToImage_B_index" ON "_AlbumToImage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaylistToTrack_AB_unique" ON "_PlaylistToTrack"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaylistToTrack_B_index" ON "_PlaylistToTrack"("B");
