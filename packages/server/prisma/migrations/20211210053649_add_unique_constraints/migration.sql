/*
  Warnings:

  - A unique constraint covering the columns `[role,albumId,artistId]` on the table `AlbumCoArtist` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,name]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[role,trackId,artistId]` on the table `TrackCoArtist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AlbumCoArtist_role_albumId_artistId_key" ON "AlbumCoArtist"("role", "albumId", "artistId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TrackCoArtist_role_trackId_artistId_key" ON "TrackCoArtist"("role", "trackId", "artistId");
