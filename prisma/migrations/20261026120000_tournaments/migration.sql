-- Tournaments (Claude Design "Natjecanja" and "Turniri admin"): a one-day event teams sign up for, played in Kolos
-- of tables like a league night. The old Tournament tables were never used (no rows in production); they get what a
-- tournament needs. A Kolo is a set of Round rows (one per table) linked by TournamentRound, so the scorepad, Tko igra
-- and the ratings work for them as they are; every table of a tournament carries its date, which makes the tournament
-- one rating period.

-- the tournament itself: when and where, its format and its registrations
ALTER TABLE "Tournament" ADD COLUMN "date" DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN "gathering_time" VARCHAR(5),
ADD COLUMN "start_time" VARCHAR(5),
ADD COLUMN "location_name" VARCHAR(100),
ADD COLUMN "location_address" VARCHAR(200),
ADD COLUMN "location_url" VARCHAR(500),
ADD COLUMN "rounds" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN "matches_per_round" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "declarations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "max_teams" INTEGER,
ADD COLUMN "entry_fee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "rules_url" VARCHAR(500),
ADD COLUMN "registrations_open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "started_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tournament" ALTER COLUMN "date" DROP DEFAULT;

ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_name_check" CHECK (length(btrim("tournament_name")) > 0);
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_gathering_time_check" CHECK ("gathering_time" IS NULL OR "gathering_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_start_time_check" CHECK ("start_time" IS NULL OR "start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_rounds_check" CHECK ("rounds" BETWEEN 1 AND 20);
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_matches_per_round_check" CHECK ("matches_per_round" IN (1, 2));
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_max_teams_check" CHECK ("max_teams" IS NULL OR "max_teams" >= 2);
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_entry_fee_check" CHECK ("entry_fee" BETWEEN 0 AND 999);
-- a tournament that started is no longer open for sign-ups; one is cancelled only before it starts
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_started_check" CHECK ("started_at" IS NULL OR NOT "registrations_open");
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_cancelled_check" CHECK ("cancelled_at" IS NULL OR ("started_at" IS NULL AND NOT "registrations_open"));

-- a team's entry: in the tournament, or on its waiting list (in the order they signed up), and who signed it up (null:
-- an admin added it)
CREATE TYPE "TournamentEntryStatus" AS ENUM ('REGISTERED', 'WAITING');

ALTER TABLE "TournamentTeam" ADD COLUMN "status" "TournamentEntryStatus" NOT NULL DEFAULT 'REGISTERED',
ADD COLUMN "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "registered_by" INTEGER;

ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "TournamentTeam_team_id_idx" ON "TournamentTeam"("team_id");
-- a table is looked up by its round id (the admin's table edits)
CREATE INDEX "TournamentRound_round_id_idx" ON "TournamentRound"("round_id");

-- Nagrade: one row per place, in order (1 = first place)
CREATE TABLE "TournamentPrize" (
    "tournament_id" INTEGER NOT NULL,
    "place"         INTEGER NOT NULL,
    "prize"         VARCHAR(100) NOT NULL,
    "description"   VARCHAR(200) NOT NULL DEFAULT '',

    CONSTRAINT "TournamentPrize_pkey" PRIMARY KEY ("tournament_id", "place"),
    CONSTRAINT "TournamentPrize_place_check" CHECK ("place" >= 1)
);

ALTER TABLE "TournamentPrize" ADD CONSTRAINT "TournamentPrize_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A table plays two matches in a league; a tournament plays one or two (Partija po kolu). Without zvanja (a tournament
-- "bez zvanja") only bela (20) is entered at the table. Every round there is now keeps the league's rules.
ALTER TABLE "Round" ADD COLUMN "matches_per_round" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "declarations" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Round" ADD CONSTRAINT "Round_matches_per_round_check" CHECK ("matches_per_round" IN (1, 2));
