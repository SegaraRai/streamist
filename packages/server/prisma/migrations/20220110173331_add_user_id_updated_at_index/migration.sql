-- CreateIndex
CREATE INDEX "Album_userId_updatedAt_idx" ON "Album"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AlbumCoArtist_userId_updatedAt_idx" ON "AlbumCoArtist"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Artist_userId_updatedAt_idx" ON "Artist"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Deletion_userId_deletedAt_idx" ON "Deletion"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Image_userId_updatedAt_idx" ON "Image"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ImageFile_userId_updatedAt_idx" ON "ImageFile"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Playlist_userId_updatedAt_idx" ON "Playlist"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Source_userId_updatedAt_idx" ON "Source"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SourceFile_userId_updatedAt_idx" ON "SourceFile"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Track_userId_updatedAt_idx" ON "Track"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "TrackCoArtist_userId_updatedAt_idx" ON "TrackCoArtist"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "TrackFile_userId_updatedAt_idx" ON "TrackFile"("userId", "updatedAt");
