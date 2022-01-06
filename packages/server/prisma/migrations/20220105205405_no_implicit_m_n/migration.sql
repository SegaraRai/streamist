/*
  Warnings:

  - You are about to drop the `_AlbumToImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtistToImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ImageToPlaylist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PlaylistToTrack` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateTable
CREATE TABLE "AAlbumImage" (
    "userId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,

    PRIMARY KEY ("albumId", "imageId"),
    CONSTRAINT "AAlbumImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AAlbumImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AAlbumImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "AAlbumImage" ("userId", "albumId", "imageId") SELECT "userId", "A", "B" FROM "_AlbumToImage" JOIN "Image" ON "B" = "id";
DROP TABLE "_AlbumToImage";

-- CreateTable
CREATE TABLE "AArtistImage" (
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,

    PRIMARY KEY ("artistId", "imageId"),
    CONSTRAINT "AArtistImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AArtistImage_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AArtistImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "AArtistImage" ("userId", "artistId", "imageId") SELECT "userId", "A", "B" FROM "_ArtistToImage" JOIN "Image" ON "B" = "id";
DROP TABLE "_ArtistToImage";

-- CreateTable
CREATE TABLE "APlaylistImage" (
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,

    PRIMARY KEY ("playlistId", "imageId"),
    CONSTRAINT "APlaylistImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistImage_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "APlaylistImage" ("userId", "playlistId", "imageId") SELECT "userId", "B", "A" FROM "_ImageToPlaylist" JOIN "Image" ON "A" = "id";
DROP TABLE "_ImageToPlaylist";

-- CreateTable
CREATE TABLE "APlaylistTrack" (
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    PRIMARY KEY ("playlistId", "trackId"),
    CONSTRAINT "APlaylistTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "APlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "APlaylistTrack" ("userId", "playlistId", "trackId") SELECT "userId", "A", "B" FROM "_PlaylistToTrack" JOIN "Track" ON "B" = "id";
DROP TABLE "_PlaylistToTrack";

-- CreateIndex
CREATE INDEX "AAlbumImage_userId_idx" ON "AAlbumImage"("userId");

-- CreateIndex
CREATE INDEX "AArtistImage_userId_idx" ON "AArtistImage"("userId");

-- CreateIndex
CREATE INDEX "APlaylistImage_userId_idx" ON "APlaylistImage"("userId");

-- CreateIndex
CREATE INDEX "APlaylistTrack_userId_idx" ON "APlaylistTrack"("userId");
