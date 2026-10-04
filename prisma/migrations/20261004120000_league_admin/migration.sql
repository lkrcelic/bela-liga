/*
  League administration (Manage League / Create League screens).

  - League gets its season, start date, play day and the default number of rounds per night.
  - LeagueTeam gets `active`: inactive teams stay in the league and its standings, but are not signed in by default
    when a round is created. Existing teams start active.
*/

-- AlterTable
ALTER TABLE "League" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "play_day" INTEGER,
ADD COLUMN     "rounds_per_night" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "season" VARCHAR(20),
ADD COLUMN     "start_date" DATE;

-- 0 = Monday ... 6 = Sunday
ALTER TABLE "League" ADD CONSTRAINT "League_play_day_check" CHECK ("play_day" IS NULL OR "play_day" BETWEEN 0 AND 6);
ALTER TABLE "League" ADD CONSTRAINT "League_rounds_per_night_check" CHECK ("rounds_per_night" BETWEEN 1 AND 6);

-- AlterTable
ALTER TABLE "LeagueTeam" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
