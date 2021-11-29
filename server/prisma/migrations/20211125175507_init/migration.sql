-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "filename" TEXT,
    "sha256" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlbumImage" (
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "nextImageId" TEXT,

    PRIMARY KEY ("albumId", "imageId"),
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrackFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "format" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "filesize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImageFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "format" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "filesize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlbumCoArtist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrackCoArtist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("artistId") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "nextTrackId" TEXT,

    PRIMARY KEY ("playlistId", "trackId"),
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AlbumToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArtistToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Artist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TagToTrack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Track" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlaylistToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE INDEX "Tag.userId_index" ON "Tag"("userId");

-- CreateIndex
CREATE INDEX "Source.userId_index" ON "Source"("userId");

-- CreateIndex
CREATE INDEX "SourceFile.userId_index" ON "SourceFile"("userId");

-- CreateIndex
CREATE INDEX "SourceFile.sourceId_index" ON "SourceFile"("sourceId");

-- CreateIndex
CREATE INDEX "Artist.userId_index" ON "Artist"("userId");

-- CreateIndex
CREATE INDEX "AlbumImage.userId_index" ON "AlbumImage"("userId");

-- CreateIndex
CREATE INDEX "AlbumImage.albumId_index" ON "AlbumImage"("albumId");

-- CreateIndex
CREATE INDEX "AlbumImage.imageId_index" ON "AlbumImage"("imageId");

-- CreateIndex
CREATE INDEX "AlbumImage.nextImageId_index" ON "AlbumImage"("nextImageId");

-- CreateIndex
CREATE INDEX "Album.userId_index" ON "Album"("userId");

-- CreateIndex
CREATE INDEX "Album.artistId_index" ON "Album"("artistId");

-- CreateIndex
CREATE INDEX "Track.userId_index" ON "Track"("userId");

-- CreateIndex
CREATE INDEX "Track.albumId_index" ON "Track"("albumId");

-- CreateIndex
CREATE INDEX "Track.artistId_index" ON "Track"("artistId");

-- CreateIndex
CREATE INDEX "TrackFile.userId_index" ON "TrackFile"("userId");

-- CreateIndex
CREATE INDEX "TrackFile.trackId_index" ON "TrackFile"("trackId");

-- CreateIndex
CREATE INDEX "Image.userId_index" ON "Image"("userId");

-- CreateIndex
CREATE INDEX "ImageFile.userId_index" ON "ImageFile"("userId");

-- CreateIndex
CREATE INDEX "ImageFile.imageId_index" ON "ImageFile"("imageId");

-- CreateIndex
CREATE INDEX "AlbumCoArtist.userId_index" ON "AlbumCoArtist"("userId");

-- CreateIndex
CREATE INDEX "AlbumCoArtist.artistId_index" ON "AlbumCoArtist"("artistId");

-- CreateIndex
CREATE INDEX "AlbumCoArtist.albumId_index" ON "AlbumCoArtist"("albumId");

-- CreateIndex
CREATE INDEX "TrackCoArtist.userId_index" ON "TrackCoArtist"("userId");

-- CreateIndex
CREATE INDEX "TrackCoArtist.artistId_index" ON "TrackCoArtist"("artistId");

-- CreateIndex
CREATE INDEX "TrackCoArtist.trackId_index" ON "TrackCoArtist"("trackId");

-- CreateIndex
CREATE INDEX "PlaylistTrack.userId_index" ON "PlaylistTrack"("userId");

-- CreateIndex
CREATE INDEX "PlaylistTrack.playlistId_index" ON "PlaylistTrack"("playlistId");

-- CreateIndex
CREATE INDEX "PlaylistTrack.trackId_index" ON "PlaylistTrack"("trackId");

-- CreateIndex
CREATE INDEX "PlaylistTrack.nextTrackId_index" ON "PlaylistTrack"("nextTrackId");

-- CreateIndex
CREATE INDEX "Playlist.userId_index" ON "Playlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToTag_AB_unique" ON "_AlbumToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToTag_B_index" ON "_AlbumToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToTag_AB_unique" ON "_ArtistToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToTag_B_index" ON "_ArtistToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTrack_AB_unique" ON "_TagToTrack"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTrack_B_index" ON "_TagToTrack"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaylistToTag_AB_unique" ON "_PlaylistToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaylistToTag_B_index" ON "_PlaylistToTag"("B");
