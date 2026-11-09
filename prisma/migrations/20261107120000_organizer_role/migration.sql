-- Organizator (DECISIONS #86): a third role beside ADMIN and PLAYER. An organizer makes tournaments and runs the ones
-- they made; everything else in the league stays the admin's. The role is in the code (_lib/auth/permissions.ts), the
-- database only says which role a player has.
-- AFTER 'ADMIN' so the database's order of the enum is the schema's (ADMIN, ORGANIZER, PLAYER)
ALTER TYPE "RoleEnum" ADD VALUE 'ORGANIZER' AFTER 'ADMIN';

-- Whose tournament it is. Null for the tournaments made before this migration: nobody owns them, so only an admin
-- touches them (ownership.ts). Set once, when the tournament is made, and never changed.
ALTER TABLE "Tournament" ADD COLUMN "created_by" INTEGER;
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- the organizer's own list of tournaments ("moji turniri") reads by this column
CREATE INDEX "Tournament_created_by_idx" ON "Tournament"("created_by");
