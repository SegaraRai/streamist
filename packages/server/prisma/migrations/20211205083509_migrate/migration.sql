/*
  Warnings:

  - Added the required column `parts` to the `SourceFile` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "filename" TEXT,
    "sha256" TEXT NOT NULL DEFAULT '',
    "fileSize" INTEGER NOT NULL,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "parts" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SourceFile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SourceFile" ("createdAt", "fileSize", "filename", "id", "region", "sha256", "sourceId", "updatedAt", "userId") SELECT "createdAt", "fileSize", "filename", "id", "region", "sha256", "sourceId", "updatedAt", "userId" FROM "SourceFile";
DROP TABLE "SourceFile";
ALTER TABLE "new_SourceFile" RENAME TO "SourceFile";
CREATE INDEX "SourceFile_userId_idx" ON "SourceFile"("userId");
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
