/*
  Manage League · Details and Create Round · Notes.

  - League gets an optional end date, after the start date when both are set.
  - League gets free-text notes for the admins (who's away next week, table changes, reminders).
*/

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "end_date" DATE,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '';

ALTER TABLE "League" ADD CONSTRAINT "League_end_date_check" CHECK ("end_date" IS NULL OR "start_date" IS NULL OR "end_date" > "start_date");
