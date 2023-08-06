/*
  Warnings:

  - Added the required column `refreshToken` to the `SpotifyConnections` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpotifyConnections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SpotifyConnections" ("accessToken", "createdAt", "expiresAt", "id") SELECT "accessToken", "createdAt", "expiresAt", "id" FROM "SpotifyConnections";
DROP TABLE "SpotifyConnections";
ALTER TABLE "new_SpotifyConnections" RENAME TO "SpotifyConnections";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
