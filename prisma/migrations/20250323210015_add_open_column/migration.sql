-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "open" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "active" SET DEFAULT false;
