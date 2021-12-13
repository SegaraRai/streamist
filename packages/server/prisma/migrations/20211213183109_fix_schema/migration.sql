-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sha256" TEXT,
    "cueSheetFileId" TEXT,
    "attachToType" TEXT,
    "attachToId" TEXT,
    "sourceFileId" TEXT,
    "entityExists" BOOLEAN NOT NULL,
    "uploaded" BOOLEAN NOT NULL,
    "uploadId" TEXT,
    "uploadedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SourceFile_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "SourceFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SourceFile" ("attachToId", "attachToType", "createdAt", "cueSheetFileId", "entityExists", "fileSize", "filename", "id", "region", "sha256", "sourceFileId", "sourceId", "type", "updatedAt", "uploadId", "uploaded", "uploadedAt", "userId") SELECT "attachToId", "attachToType", "createdAt", "cueSheetFileId", "entityExists", "fileSize", "filename", "id", "region", "sha256", "sourceFileId", "sourceId", "type", "updatedAt", "uploadId", "uploaded", "uploadedAt", "userId" FROM "SourceFile";
DROP TABLE "SourceFile";
ALTER TABLE "new_SourceFile" RENAME TO "SourceFile";
CREATE INDEX "SourceFile_userId_idx" ON "SourceFile"("userId");
CREATE INDEX "SourceFile_sourceId_idx" ON "SourceFile"("sourceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
