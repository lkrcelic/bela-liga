/*
  Warnings:

  - Made the column `team1_id` on table `Round` required. This step will fail if there are existing NULL values in that column.
  - Made the column `team2_id` on table `Round` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Round" ALTER COLUMN "team1_id" SET NOT NULL,
ALTER COLUMN "team2_id" SET NOT NULL;
