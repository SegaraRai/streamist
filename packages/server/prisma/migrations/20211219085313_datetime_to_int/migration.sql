/*
  Warnings:

  - You are about to alter the column `createdAt` on the `ImageFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `ImageFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Playlist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Playlist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `TrackFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `TrackFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Image` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Image` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `SourceFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `SourceFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `uploadedAt` on the `SourceFile` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `AlbumCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `AlbumCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `deletedAt` on the `Deletion` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Tag` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Tag` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Album` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Album` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Artist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Artist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `TrackCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `TrackCoArtist` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `createdAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `transcodeFinishedAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `transcodeStartedAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.
  - You are about to alter the column `updatedAt` on the `Source` table. The data in that column could be lost. The data in that column will be cast from `DateTime` to `Int`.

*/
-- CreateTable
CREATE TABLE "ResourceUpdate" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "updatedAt" INTEGER NOT NULL,
    CONSTRAINT "ResourceUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImageFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ImageFile_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ImageFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ImageFile" ("createdAt", "extension", "fileSize", "format", "height", "id", "imageId", "mimeType", "region", "sha256", "updatedAt", "userId", "width") SELECT "createdAt", "extension", "fileSize", "format", "height", "id", "imageId", "mimeType", "region", "sha256", "updatedAt", "userId", "width" FROM "ImageFile";
DROP TABLE "ImageFile";
ALTER TABLE "new_ImageFile" RENAME TO "ImageFile";
CREATE INDEX "ImageFile_userId_idx" ON "ImageFile"("userId");
CREATE INDEX "ImageFile_imageId_idx" ON "ImageFile"("imageId");
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT '',
    "trackOrder" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Playlist" ("createdAt", "id", "imageOrder", "notes", "title", "trackOrder", "updatedAt", "userId") SELECT "createdAt", "id", "imageOrder", "notes", "title", "trackOrder", "updatedAt", "userId" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE INDEX "Playlist_userId_idx" ON "Playlist"("userId");
CREATE TABLE "new_TrackFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TrackFile_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrackFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrackFile" ("createdAt", "duration", "extension", "fileSize", "format", "id", "mimeType", "region", "sha256", "trackId", "updatedAt", "userId") SELECT "createdAt", "duration", "extension", "fileSize", "format", "id", "mimeType", "region", "sha256", "trackId", "updatedAt", "userId" FROM "TrackFile";
DROP TABLE "TrackFile";
ALTER TABLE "new_TrackFile" RENAME TO "TrackFile";
CREATE INDEX "TrackFile_userId_idx" ON "TrackFile"("userId");
CREATE INDEX "TrackFile_trackId_idx" ON "TrackFile"("trackId");
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceWidth" INTEGER NOT NULL,
    "sourceHeight" INTEGER NOT NULL,
    "dHash" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Image_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "dHash", "id", "sourceFileId", "sourceHeight", "sourceWidth", "updatedAt", "userId") SELECT "createdAt", "dHash", "id", "sourceFileId", "sourceHeight", "sourceWidth", "updatedAt", "userId" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE INDEX "Image_userId_idx" ON "Image"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "updatedAt") SELECT "createdAt", "email", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT,
    "cueSheetFileId" TEXT,
    "attachToType" TEXT,
    "attachToId" TEXT,
    "sourceFileId" TEXT,
    "entityExists" BOOLEAN NOT NULL,
    "uploadId" TEXT,
    "uploadedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SourceFile_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SourceFile" ("attachToId", "attachToType", "createdAt", "cueSheetFileId", "entityExists", "fileSize", "filename", "id", "region", "sha256", "sourceFileId", "sourceId", "state", "type", "updatedAt", "uploadId", "uploadedAt", "userId") SELECT "attachToId", "attachToType", "createdAt", "cueSheetFileId", "entityExists", "fileSize", "filename", "id", "region", "sha256", "sourceFileId", "sourceId", "state", "type", "updatedAt", "uploadId", "uploadedAt", "userId" FROM "SourceFile";
DROP TABLE "SourceFile";
ALTER TABLE "new_SourceFile" RENAME TO "SourceFile";
CREATE INDEX "SourceFile_userId_idx" ON "SourceFile"("userId");
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");
CREATE TABLE "new_AlbumCoArtist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    CONSTRAINT "AlbumCoArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AlbumCoArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AlbumCoArtist_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AlbumCoArtist" ("albumId", "artistId", "createdAt", "id", "role", "updatedAt", "userId") SELECT "albumId", "artistId", "createdAt", "id", "role", "updatedAt", "userId" FROM "AlbumCoArtist";
DROP TABLE "AlbumCoArtist";
ALTER TABLE "new_AlbumCoArtist" RENAME TO "AlbumCoArtist";
CREATE INDEX "AlbumCoArtist_userId_idx" ON "AlbumCoArtist"("userId");
CREATE INDEX "AlbumCoArtist_artistId_idx" ON "AlbumCoArtist"("artistId");
CREATE INDEX "AlbumCoArtist_albumId_idx" ON "AlbumCoArtist"("albumId");
CREATE UNIQUE INDEX "AlbumCoArtist_role_albumId_artistId_key" ON "AlbumCoArtist"("role", "albumId", "artistId");
CREATE TABLE "new_Deletion" (
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "deletedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("entityType", "entityId", "userId"),
    CONSTRAINT "Deletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Deletion" ("deletedAt", "entityId", "entityType", "userId") SELECT "deletedAt", "entityId", "entityType", "userId" FROM "Deletion";
DROP TABLE "Deletion";
ALTER TABLE "new_Deletion" RENAME TO "Deletion";
CREATE INDEX "Deletion_userId_idx" ON "Deletion"("userId");
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
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,
    CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Track_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("albumId", "artistId", "bpm", "comment", "createdAt", "discNumber", "duration", "genre", "id", "lyric", "releaseDate", "releaseDatePrecision", "releaseDateText", "replayGainGain", "replayGainPeak", "sourceFileId", "title", "titleSort", "trackNumber", "updatedAt", "userId") SELECT "albumId", "artistId", "bpm", "comment", "createdAt", "discNumber", "duration", "genre", "id", "lyric", "releaseDate", "releaseDatePrecision", "releaseDateText", "replayGainGain", "replayGainPeak", "sourceFileId", "title", "titleSort", "trackNumber", "updatedAt", "userId" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE INDEX "Track_userId_idx" ON "Track"("userId");
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("createdAt", "id", "name", "updatedAt", "userId") SELECT "createdAt", "id", "name", "updatedAt", "userId" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "replayGainGain" REAL,
    "replayGainPeak" REAL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Album" ("artistId", "createdAt", "id", "imageOrder", "notes", "replayGainGain", "replayGainPeak", "title", "titleSort", "updatedAt", "userId") SELECT "artistId", "createdAt", "id", "imageOrder", "notes", "replayGainGain", "replayGainPeak", "title", "titleSort", "updatedAt", "userId" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE INDEX "Album_userId_idx" ON "Album"("userId");
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");
CREATE TABLE "new_Artist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameSort" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Artist" ("createdAt", "id", "imageOrder", "name", "nameSort", "updatedAt", "userId") SELECT "createdAt", "id", "imageOrder", "name", "nameSort", "updatedAt", "userId" FROM "Artist";
DROP TABLE "Artist";
ALTER TABLE "new_Artist" RENAME TO "Artist";
CREATE INDEX "Artist_userId_idx" ON "Artist"("userId");
CREATE TABLE "new_TrackCoArtist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    CONSTRAINT "TrackCoArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrackCoArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrackCoArtist_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrackCoArtist" ("artistId", "createdAt", "id", "role", "trackId", "updatedAt", "userId") SELECT "artistId", "createdAt", "id", "role", "trackId", "updatedAt", "userId" FROM "TrackCoArtist";
DROP TABLE "TrackCoArtist";
ALTER TABLE "new_TrackCoArtist" RENAME TO "TrackCoArtist";
CREATE INDEX "TrackCoArtist_userId_idx" ON "TrackCoArtist"("userId");
CREATE INDEX "TrackCoArtist_artistId_idx" ON "TrackCoArtist"("artistId");
CREATE INDEX "TrackCoArtist_trackId_idx" ON "TrackCoArtist"("trackId");
CREATE UNIQUE INDEX "TrackCoArtist_role_trackId_artistId_key" ON "TrackCoArtist"("role", "trackId", "artistId");
CREATE TABLE "new_Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL,
    "transcodeStartedAt" INTEGER,
    "transcodeFinishedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Source" ("createdAt", "id", "state", "transcodeFinishedAt", "transcodeStartedAt", "updatedAt", "userId") SELECT "createdAt", "id", "state", "transcodeFinishedAt", "transcodeStartedAt", "updatedAt", "userId" FROM "Source";
DROP TABLE "Source";
ALTER TABLE "new_Source" RENAME TO "Source";
CREATE INDEX "Source_userId_idx" ON "Source"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
