/*
  Warnings:

  - Made the column `player_pair1_score` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `player_pair2_score` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BelaResult" ADD COLUMN     "player_pair1_total_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "player_pair2_total_points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "player_pair1_score" SET NOT NULL,
ALTER COLUMN "player_pair1_score" SET DEFAULT 0,
ALTER COLUMN "player_pair2_score" SET NOT NULL,
ALTER COLUMN "player_pair2_score" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "OngoingBelaResult" ADD COLUMN     "player_pair1_total_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "player_pair2_total_points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OngoingMatch" ADD COLUMN     "player_pair1_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "player_pair2_score" INTEGER NOT NULL DEFAULT 0;
