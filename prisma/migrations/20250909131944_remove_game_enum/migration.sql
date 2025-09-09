/*
  Warnings:

  - You are about to drop the column `game_type` on the `League` table. All the data in the column will be lost.
  - You are about to drop the column `game_type` on the `Tournament` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "League" DROP COLUMN "game_type";

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "game_type";

-- DropEnum
DROP TYPE "GameEnum";
