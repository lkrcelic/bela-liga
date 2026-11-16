/*
  Liga na dvije lokacije u Beli (LOKACIJE_PLAN.md, DECISIONS #98): the second place of a two-place night can play its
  own Broj kola. LeagueNight.second_rounds_per_night: that place's number when it differs from the night's (null: the
  same as the first place's, and always null on a one-place night), 1 to 6 as rounds_per_night. Bela's own: Treseta's
  locations migrations are taken unchanged, and Treseta has no Broj kola per night.
*/

-- AlterTable
ALTER TABLE "LeagueNight" ADD COLUMN "second_rounds_per_night" INTEGER;

ALTER TABLE "LeagueNight" ADD CONSTRAINT "LeagueNight_second_rounds_per_night_check"
  CHECK ("second_rounds_per_night" IS NULL OR ("second_location_id" IS NOT NULL AND "second_rounds_per_night" BETWEEN 1 AND 6));
