/*
  Warnings:

  - The primary key for the `AAlbumImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `albumId` on the `AAlbumImage` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `AAlbumImage` table. All the data in the column will be lost.
  - The primary key for the `APlaylistTrack` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `playlistId` on the `APlaylistTrack` table. All the data in the column will be lost.
  - You are about to drop the column `trackId` on the `APlaylistTrack` table. All the data in the column will be lost.
  - The primary key for the `APlaylistImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `imageId` on the `APlaylistImage` table. All the data in the column will be lost.
  - You are about to drop the column `playlistId` on the `APlaylistImage` table. All the data in the column will be lost.
  - The primary key for the `AArtistImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `artistId` on the `AArtistImage` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `AArtistImage` table. All the data in the column will be lost.
  - Added the required column `x` to the `AAlbumImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `AAlbumImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x` to the `APlaylistTrack` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `APlaylistTrack` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x` to the `APlaylistImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `APlaylistImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `x` to the `AArtistImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `y` to the `AArtistImage` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AAlbumImage" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    PRIMARY KEY ("x", "y"),
    CONSTRAINT "AAlbumImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AAlbumImage_x_fkey" FOREIGN KEY ("x") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AAlbumImage_y_fkey" FOREIGN KEY ("y") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AAlbumImage" ("userId", "x", "y") SELECT "userId", "albumId", "imageId" FROM "AAlbumImage";
DROP TABLE "AAlbumImage";
ALTER TABLE "new_AAlbumImage" RENAME TO "AAlbumImage";
CREATE INDEX "AAlbumImage_userId_idx" ON "AAlbumImage"("userId");
CREATE TABLE "new_APlaylistTrack" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    PRIMARY KEY ("x", "y"),
    CONSTRAINT "APlaylistTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistTrack_x_fkey" FOREIGN KEY ("x") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistTrack_y_fkey" FOREIGN KEY ("y") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_APlaylistTrack" ("userId", "x", "y") SELECT "userId", "playlistId", "trackId" FROM "APlaylistTrack";
DROP TABLE "APlaylistTrack";
ALTER TABLE "new_APlaylistTrack" RENAME TO "APlaylistTrack";
CREATE INDEX "APlaylistTrack_userId_idx" ON "APlaylistTrack"("userId");
CREATE TABLE "new_APlaylistImage" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    PRIMARY KEY ("x", "y"),
    CONSTRAINT "APlaylistImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistImage_x_fkey" FOREIGN KEY ("x") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistImage_y_fkey" FOREIGN KEY ("y") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_APlaylistImage" ("userId", "x", "y") SELECT "userId", "playlistId", "imageId" FROM "APlaylistImage";
DROP TABLE "APlaylistImage";
ALTER TABLE "new_APlaylistImage" RENAME TO "APlaylistImage";
CREATE INDEX "APlaylistImage_userId_idx" ON "APlaylistImage"("userId");
CREATE TABLE "new_AArtistImage" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    PRIMARY KEY ("x", "y"),
    CONSTRAINT "AArtistImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AArtistImage_x_fkey" FOREIGN KEY ("x") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AArtistImage_y_fkey" FOREIGN KEY ("y") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AArtistImage" ("userId", "x", "y") SELECT "userId", "artistId", "imageId" FROM "AArtistImage";
DROP TABLE "AArtistImage";
ALTER TABLE "new_AArtistImage" RENAME TO "AArtistImage";
CREATE INDEX "AArtistImage_userId_idx" ON "AArtistImage"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
