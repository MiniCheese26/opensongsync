/*
  Warnings:

  - Added the required column `connectionType` to the `Connections` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Connections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "connectionType" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Connections" ("accessToken", "createdAt", "expiresAt", "id") SELECT "accessToken", "createdAt", "expiresAt", "id" FROM "Connections";
DROP TABLE "Connections";
ALTER TABLE "new_Connections" RENAME TO "Connections";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
