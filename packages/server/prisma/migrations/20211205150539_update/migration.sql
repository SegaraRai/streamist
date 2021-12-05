/*
  Warnings:

  - Added the required column `type` to the `SourceFile` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sha256" TEXT,
    "fileSize" INTEGER NOT NULL,
    "cueSheetFileId" TEXT,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "uploadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SourceFile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SourceFile" ("createdAt", "fileSize", "filename", "id", "region", "sha256", "sourceId", "updatedAt", "uploadId", "uploaded", "userId") SELECT "createdAt", "fileSize", "filename", "id", "region", "sha256", "sourceId", "updatedAt", "uploadId", "uploaded", "userId" FROM "SourceFile";
DROP TABLE "SourceFile";
ALTER TABLE "new_SourceFile" RENAME TO "SourceFile";
CREATE INDEX "SourceFile_userId_idx" ON "SourceFile"("userId");
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
