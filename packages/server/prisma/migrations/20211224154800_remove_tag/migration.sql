/*
  Warnings:

  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AlbumToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtistToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PlaylistToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TagToTrack` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_AlbumToTag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ArtistToTag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_PlaylistToTag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TagToTrack";
PRAGMA foreign_keys=on;
