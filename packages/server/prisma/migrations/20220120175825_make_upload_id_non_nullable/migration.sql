/*
  Warnings:

  - Made the column `uploadId` on table `SourceFile` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    "attachPrepend" BOOLEAN,
    "sourceFileId" TEXT,
    "entityExists" BOOLEAN NOT NULL,
    "uploadId" TEXT NOT NULL,
    "uploadedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SourceFile_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SourceFile" ("attachPrepend", "attachToId", "attachToType", "createdAt", "cueSheetFileId", "entityExists", "fileSize", "filename", "id", "region", "sha256", "sourceFileId", "sourceId", "state", "type", "updatedAt", "uploadId", "uploadedAt", "userId") SELECT "attachPrepend", "attachToId", "attachToType", "createdAt", "cueSheetFileId", "entityExists", "fileSize", "filename", "id", "region", "sha256", "sourceFileId", "sourceId", "state", "type", "updatedAt", "uploadId", "uploadedAt", "userId" FROM "SourceFile";
DROP TABLE "SourceFile";
ALTER TABLE "new_SourceFile" RENAME TO "SourceFile";
CREATE INDEX "SourceFile_userId_idx" ON "SourceFile"("userId");
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");
CREATE INDEX "SourceFile_userId_updatedAt_idx" ON "SourceFile"("userId", "updatedAt");
CREATE INDEX "SourceFile_uploadedAt_idx" ON "SourceFile"("uploadedAt");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
