-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Artist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameSort" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "imageOrder" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Artist" ("createdAt", "id", "imageOrder", "name", "nameSort", "updatedAt", "userId") SELECT "createdAt", "id", "imageOrder", "name", "nameSort", "updatedAt", "userId" FROM "Artist";
DROP TABLE "Artist";
ALTER TABLE "new_Artist" RENAME TO "Artist";
CREATE INDEX "Artist_userId_idx" ON "Artist"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
