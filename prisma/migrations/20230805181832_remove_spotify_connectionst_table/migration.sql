/*
  Warnings:

  - You are about to drop the `SpotifyConnections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SpotifyConnections";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SpotifyAuthorisationCodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL
);
