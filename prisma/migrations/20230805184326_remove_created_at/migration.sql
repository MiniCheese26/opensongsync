/*
  Warnings:

  - You are about to drop the column `createdAt` on the `SpotifyConnections` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TidalConnections` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpotifyConnections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);
INSERT INTO "new_SpotifyConnections" ("accessToken", "expiresAt", "id", "refreshToken") SELECT "accessToken", "expiresAt", "id", "refreshToken" FROM "SpotifyConnections";
DROP TABLE "SpotifyConnections";
ALTER TABLE "new_SpotifyConnections" RENAME TO "SpotifyConnections";
CREATE TABLE "new_TidalConnections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL
);
INSERT INTO "new_TidalConnections" ("accessToken", "expiresAt", "id", "refreshToken", "userId") SELECT "accessToken", "expiresAt", "id", "refreshToken", "userId" FROM "TidalConnections";
DROP TABLE "TidalConnections";
ALTER TABLE "new_TidalConnections" RENAME TO "TidalConnections";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
