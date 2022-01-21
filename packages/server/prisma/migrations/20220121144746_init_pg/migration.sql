-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "maxTrackId" TEXT,
    "closedAt" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "transcodeStartedAt" DOUBLE PRECISION,
    "transcodeFinishedAt" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT,
    "cueSheetFileId" TEXT,
    "attachToType" TEXT,
    "attachToId" TEXT,
    "attachPrepend" BOOLEAN,
    "sourceFileId" TEXT,
    "entityExists" BOOLEAN NOT NULL,
    "uploadId" TEXT NOT NULL,
    "uploadedAt" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SourceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSort" TEXT,
    "description" TEXT NOT NULL DEFAULT E'',
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT E'',

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "description" TEXT NOT NULL DEFAULT E'',
    "replayGainGain" DOUBLE PRECISION,
    "replayGainPeak" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT E'',

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSort" TEXT,
    "discNumber" INTEGER NOT NULL,
    "trackNumber" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "lyrics" TEXT,
    "releaseDate" TEXT,
    "releaseDatePrecision" TEXT,
    "releaseDateText" TEXT,
    "genre" TEXT,
    "bpm" INTEGER,
    "replayGainGain" DOUBLE PRECISION,
    "replayGainPeak" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackFile" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TrackFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "sourceWidth" INTEGER NOT NULL,
    "sourceHeight" INTEGER NOT NULL,
    "dHash" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceFileId" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageFile" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "imageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ImageFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumCoArtist" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,

    CONSTRAINT "AlbumCoArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackCoArtist" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    CONSTRAINT "TrackCoArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT E'',
    "createdAt" DOUBLE PRECISION NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT E'',
    "trackOrder" TEXT NOT NULL DEFAULT E'',

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deletion" (
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "deletedAt" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Deletion_pkey" PRIMARY KEY ("entityType","entityId","userId")
);

-- CreateTable
CREATE TABLE "ResourceUpdate" (
    "userId" TEXT NOT NULL,
    "updatedAt" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ResourceUpdate_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AAlbumImage" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    CONSTRAINT "AAlbumImage_pkey" PRIMARY KEY ("x","y")
);

-- CreateTable
CREATE TABLE "AArtistImage" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    CONSTRAINT "AArtistImage_pkey" PRIMARY KEY ("x","y")
);

-- CreateTable
CREATE TABLE "APlaylistImage" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    CONSTRAINT "APlaylistImage_pkey" PRIMARY KEY ("x","y")
);

-- CreateTable
CREATE TABLE "APlaylistTrack" (
    "userId" TEXT NOT NULL,
    "x" TEXT NOT NULL,
    "y" TEXT NOT NULL,

    CONSTRAINT "APlaylistTrack_pkey" PRIMARY KEY ("x","y")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_closedAt_idx" ON "User"("closedAt");

-- CreateIndex
CREATE INDEX "Source_userId_idx" ON "Source"("userId");

-- CreateIndex
CREATE INDEX "Source_userId_updatedAt_idx" ON "Source"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Source_state_idx" ON "Source"("state");

-- CreateIndex
CREATE INDEX "SourceFile_userId_idx" ON "SourceFile"("userId");

-- CreateIndex
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");

-- CreateIndex
CREATE INDEX "SourceFile_userId_updatedAt_idx" ON "SourceFile"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SourceFile_uploadedAt_idx" ON "SourceFile"("uploadedAt");

-- CreateIndex
CREATE INDEX "Artist_userId_idx" ON "Artist"("userId");

-- CreateIndex
CREATE INDEX "Artist_userId_updatedAt_idx" ON "Artist"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Album_userId_idx" ON "Album"("userId");

-- CreateIndex
CREATE INDEX "Album_artistId_idx" ON "Album"("artistId");

-- CreateIndex
CREATE INDEX "Album_userId_updatedAt_idx" ON "Album"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Track_userId_idx" ON "Track"("userId");

-- CreateIndex
CREATE INDEX "Track_albumId_idx" ON "Track"("albumId");

-- CreateIndex
CREATE INDEX "Track_artistId_idx" ON "Track"("artistId");

-- CreateIndex
CREATE INDEX "Track_userId_updatedAt_idx" ON "Track"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "TrackFile_userId_idx" ON "TrackFile"("userId");

-- CreateIndex
CREATE INDEX "TrackFile_trackId_idx" ON "TrackFile"("trackId");

-- CreateIndex
CREATE INDEX "TrackFile_userId_updatedAt_idx" ON "TrackFile"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Image_userId_idx" ON "Image"("userId");

-- CreateIndex
CREATE INDEX "Image_userId_updatedAt_idx" ON "Image"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ImageFile_userId_idx" ON "ImageFile"("userId");

-- CreateIndex
CREATE INDEX "ImageFile_imageId_idx" ON "ImageFile"("imageId");

-- CreateIndex
CREATE INDEX "ImageFile_userId_updatedAt_idx" ON "ImageFile"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AlbumCoArtist_userId_idx" ON "AlbumCoArtist"("userId");

-- CreateIndex
CREATE INDEX "AlbumCoArtist_artistId_idx" ON "AlbumCoArtist"("artistId");

-- CreateIndex
CREATE INDEX "AlbumCoArtist_albumId_idx" ON "AlbumCoArtist"("albumId");

-- CreateIndex
CREATE INDEX "AlbumCoArtist_userId_updatedAt_idx" ON "AlbumCoArtist"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumCoArtist_role_albumId_artistId_key" ON "AlbumCoArtist"("role", "albumId", "artistId");

-- CreateIndex
CREATE INDEX "TrackCoArtist_userId_idx" ON "TrackCoArtist"("userId");

-- CreateIndex
CREATE INDEX "TrackCoArtist_artistId_idx" ON "TrackCoArtist"("artistId");

-- CreateIndex
CREATE INDEX "TrackCoArtist_trackId_idx" ON "TrackCoArtist"("trackId");

-- CreateIndex
CREATE INDEX "TrackCoArtist_userId_updatedAt_idx" ON "TrackCoArtist"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackCoArtist_role_trackId_artistId_key" ON "TrackCoArtist"("role", "trackId", "artistId");

-- CreateIndex
CREATE INDEX "Playlist_userId_idx" ON "Playlist"("userId");

-- CreateIndex
CREATE INDEX "Playlist_userId_updatedAt_idx" ON "Playlist"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Deletion_userId_idx" ON "Deletion"("userId");

-- CreateIndex
CREATE INDEX "Deletion_userId_deletedAt_idx" ON "Deletion"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "AAlbumImage_userId_idx" ON "AAlbumImage"("userId");

-- CreateIndex
CREATE INDEX "AAlbumImage_x_idx" ON "AAlbumImage"("x");

-- CreateIndex
CREATE INDEX "AAlbumImage_y_idx" ON "AAlbumImage"("y");

-- CreateIndex
CREATE INDEX "AArtistImage_userId_idx" ON "AArtistImage"("userId");

-- CreateIndex
CREATE INDEX "AArtistImage_x_idx" ON "AArtistImage"("x");

-- CreateIndex
CREATE INDEX "AArtistImage_y_idx" ON "AArtistImage"("y");

-- CreateIndex
CREATE INDEX "APlaylistImage_userId_idx" ON "APlaylistImage"("userId");

-- CreateIndex
CREATE INDEX "APlaylistImage_x_idx" ON "APlaylistImage"("x");

-- CreateIndex
CREATE INDEX "APlaylistImage_y_idx" ON "APlaylistImage"("y");

-- CreateIndex
CREATE INDEX "APlaylistTrack_userId_idx" ON "APlaylistTrack"("userId");

-- CreateIndex
CREATE INDEX "APlaylistTrack_x_idx" ON "APlaylistTrack"("x");

-- CreateIndex
CREATE INDEX "APlaylistTrack_y_idx" ON "APlaylistTrack"("y");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceFile" ADD CONSTRAINT "SourceFile_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceFile" ADD CONSTRAINT "SourceFile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceFile" ADD CONSTRAINT "SourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackFile" ADD CONSTRAINT "TrackFile_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackFile" ADD CONSTRAINT "TrackFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageFile" ADD CONSTRAINT "ImageFile_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageFile" ADD CONSTRAINT "ImageFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCoArtist" ADD CONSTRAINT "AlbumCoArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCoArtist" ADD CONSTRAINT "AlbumCoArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumCoArtist" ADD CONSTRAINT "AlbumCoArtist_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCoArtist" ADD CONSTRAINT "TrackCoArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCoArtist" ADD CONSTRAINT "TrackCoArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackCoArtist" ADD CONSTRAINT "TrackCoArtist_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deletion" ADD CONSTRAINT "Deletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUpdate" ADD CONSTRAINT "ResourceUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AAlbumImage" ADD CONSTRAINT "AAlbumImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AAlbumImage" ADD CONSTRAINT "AAlbumImage_x_fkey" FOREIGN KEY ("x") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AAlbumImage" ADD CONSTRAINT "AAlbumImage_y_fkey" FOREIGN KEY ("y") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AArtistImage" ADD CONSTRAINT "AArtistImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AArtistImage" ADD CONSTRAINT "AArtistImage_x_fkey" FOREIGN KEY ("x") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AArtistImage" ADD CONSTRAINT "AArtistImage_y_fkey" FOREIGN KEY ("y") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APlaylistImage" ADD CONSTRAINT "APlaylistImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APlaylistImage" ADD CONSTRAINT "APlaylistImage_x_fkey" FOREIGN KEY ("x") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APlaylistImage" ADD CONSTRAINT "APlaylistImage_y_fkey" FOREIGN KEY ("y") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APlaylistTrack" ADD CONSTRAINT "APlaylistTrack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APlaylistTrack" ADD CONSTRAINT "APlaylistTrack_x_fkey" FOREIGN KEY ("x") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APlaylistTrack" ADD CONSTRAINT "APlaylistTrack_y_fkey" FOREIGN KEY ("y") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
