/*
  Warnings:

  - You are about to drop the column `birth_year` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Player` table. All the data in the column will be lost.
  - Added the required column `birth_date` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Made the column `first_name` on table `Player` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "birth_year",
DROP COLUMN "city",
ADD COLUMN     "birth_date" DATE NOT NULL,
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;
