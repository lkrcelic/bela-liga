/*
  Warnings:

  - You are about to drop the column `trump_type` on the `BelaResult` table. All the data in the column will be lost.
  - You are about to drop the column `trump_type` on the `OngoingBelaResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BelaResult" DROP COLUMN "trump_type";

-- AlterTable
ALTER TABLE "OngoingBelaResult" DROP COLUMN "trump_type";

-- DropEnum
DROP TYPE "TrumpEnum";
