/*
  Warnings:

  - Added the required column `region` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "maxTrackId" TEXT,
    "closedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);
INSERT INTO "new_User" ("closedAt", "createdAt", "displayName", "id", "maxTrackId", "password", "plan", "updatedAt", "username", "region") SELECT "closedAt", "createdAt", "displayName", "id", "maxTrackId", "password", "plan", "updatedAt", "username", 'ap-northeast-1' FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_closedAt_idx" ON "User"("closedAt");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
