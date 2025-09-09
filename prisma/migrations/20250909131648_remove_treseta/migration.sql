/*
  Warnings:

  - The values [TRESETA] on the enum `GameEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `TresetaPlayerAnnouncement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TresetaResult` table. If the table is not empty, all the data it contains will be lost.

*/

-- DropForeignKey
ALTER TABLE "TresetaPlayerAnnouncement" DROP CONSTRAINT "TresetaPlayerAnnouncement_player_id_fkey";

-- DropForeignKey
ALTER TABLE "TresetaPlayerAnnouncement" DROP CONSTRAINT "TresetaPlayerAnnouncement_result_id_fkey";

-- DropForeignKey
ALTER TABLE "TresetaResult" DROP CONSTRAINT "TresetaResult_match_id_fkey";

-- DropTable
DROP TABLE "TresetaPlayerAnnouncement";

-- DropTable
DROP TABLE "TresetaResult";

-- DropEnum
DROP TYPE "TresetaAnnouncementEnum";
