-- AlterTable
ALTER TABLE "BelaResult" ADD COLUMN     "player_pair1_total_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "player_pair2_total_points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OngoingBelaResult" ADD COLUMN     "player_pair1_total_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "player_pair2_total_points" INTEGER NOT NULL DEFAULT 0;
