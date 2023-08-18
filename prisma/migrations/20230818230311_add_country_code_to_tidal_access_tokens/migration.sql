/*
  Warnings:

  - Added the required column `countryCode` to the `TidalAccessTokens` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TidalAccessTokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "countryCode" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);
INSERT INTO "new_TidalAccessTokens" ("accessToken", "expiresAt", "id", "refreshToken", "userId") SELECT "accessToken", "expiresAt", "id", "refreshToken", "userId" FROM "TidalAccessTokens";
DROP TABLE "TidalAccessTokens";
ALTER TABLE "new_TidalAccessTokens" RENAME TO "TidalAccessTokens";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
