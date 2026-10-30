-- Turniri, prva verzija (Claude Design "Turniri admin", "Vrijeme partije", "Nedolazak za stol", "Zabrana prijava",
-- "Potvrda dolaska"). Everything is added; nothing that exists changes.

-- Vrijeme partije: every match has a time limit, 35 minutes unless the league or the tournament says otherwise
ALTER TABLE "League" ADD COLUMN "game_minutes" INTEGER NOT NULL DEFAULT 35;
ALTER TABLE "League" ADD CONSTRAINT "League_game_minutes_check" CHECK ("game_minutes" BETWEEN 5 AND 180);

-- the tournament: its time limit, the organizer's phone (required for a new one; the old ones have none), who
-- cancelled it, and when the start time's switch ran (unconfirmed teams inactive, confirmed waiting teams in)
ALTER TABLE "Tournament" ADD COLUMN "game_minutes" INTEGER NOT NULL DEFAULT 35,
ADD COLUMN "organizer_phone" VARCHAR(30),
ADD COLUMN "cancelled_by" INTEGER,
ADD COLUMN "arrival_closed_at" TIMESTAMP(3);
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_game_minutes_check" CHECK ("game_minutes" BETWEEN 5 AND 180);
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- a running match: when it started (Tko igra · Započni igru, or the second match opening) and when its time is up
-- (null: no limit, e.g. a match already running when this was deployed)
ALTER TABLE "OngoingMatch" ADD COLUMN "started_at" TIMESTAMP(3),
ADD COLUMN "ends_at" TIMESTAMP(3);
-- a match closed by its time limit with the score entered then
ALTER TABLE "Match" ADD COLUMN "time_expired" BOOLEAN NOT NULL DEFAULT false;

-- Nedolazak za stol: the answer to "Jesu li … za stolom?" (PRESENT: Da, tu su; NO_SHOW: Ne, nisu došli, the
-- answering team wins 1001:700 per match) or SKIPPED (nobody started or answered within 10 minutes: not scored).
-- attendance_team_id: the team that answered; the one that didn't come is the other team.
CREATE TYPE "RoundAttendance" AS ENUM ('PRESENT', 'NO_SHOW', 'SKIPPED');
ALTER TABLE "Round" ADD COLUMN "attendance" "RoundAttendance",
ADD COLUMN "attendance_team_id" INTEGER,
ADD COLUMN "attendance_by" INTEGER,
ADD COLUMN "attendance_at" TIMESTAMP(3);
ALTER TABLE "Round" ADD CONSTRAINT "Round_attendance_team_check" CHECK ("attendance_team_id" IS NULL OR "attendance_team_id" IN ("team1_id", "team2_id"));
-- an answer has a time; a skipped table has no answering team, an answered one has it
ALTER TABLE "Round" ADD CONSTRAINT "Round_attendance_at_check" CHECK (("attendance" IS NULL) = ("attendance_at" IS NULL));
ALTER TABLE "Round" ADD CONSTRAINT "Round_attendance_skipped_check" CHECK ("attendance" IS DISTINCT FROM 'SKIPPED' OR "attendance_team_id" IS NULL);
ALTER TABLE "Round" ADD CONSTRAINT "Round_attendance_answer_check" CHECK ("attendance" IS NULL OR "attendance" = 'SKIPPED' OR "attendance_team_id" IS NOT NULL);
ALTER TABLE "Round" ADD CONSTRAINT "Round_attendance_by_fkey" FOREIGN KEY ("attendance_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Potvrda dolaska and Isključi ekipu: a team's day at the tournament. arrived_*: Tu smo (or the admin's Označi
-- dolazak); active: it is paired in the next Kolo (Aktivna); excluded_*: out of the rest of the tournament after a
-- Kolo (a no-show, a skipped match, or the admin), until an admin brings it back (Vrati)
CREATE TYPE "TournamentExclusion" AS ENUM ('NO_SHOW', 'SKIPPED', 'ADMIN');
ALTER TABLE "TournamentTeam" ADD COLUMN "arrived_at" TIMESTAMP(3),
ADD COLUMN "arrived_by" INTEGER,
ADD COLUMN "arrived_by_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "excluded_at" TIMESTAMP(3),
ADD COLUMN "excluded_kolo" INTEGER,
ADD COLUMN "excluded_reason" "TournamentExclusion";
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_excluded_check" CHECK (("excluded_at" IS NULL) = ("excluded_reason" IS NULL));
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_arrived_by_fkey" FOREIGN KEY ("arrived_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Zabrana prijava: a team or a player may not sign up for any tournament until the day "until" (null: Trajno) or until
-- an admin lifts it. A team's ban usually comes with a ban for each of its players (via_ban_id: "preko ekipe"). A ban
-- the app sets itself (a no-show in Kolo 1) has no created_by and names its tournament.
CREATE TABLE "SignupBan" (
    "id"            SERIAL NOT NULL,
    "team_id"       INTEGER,
    "player_id"     INTEGER,
    "via_ban_id"    INTEGER,
    "until"         DATE,
    "reason"        VARCHAR(200) NOT NULL DEFAULT '',
    "tournament_id" INTEGER,
    "created_by"    INTEGER,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lifted_at"     TIMESTAMP(3),
    "lifted_by"     INTEGER,

    CONSTRAINT "SignupBan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SignupBan_target_check" CHECK (("team_id" IS NULL) <> ("player_id" IS NULL)),
    CONSTRAINT "SignupBan_via_check" CHECK ("via_ban_id" IS NULL OR "player_id" IS NOT NULL)
);
CREATE INDEX "SignupBan_team_id_idx" ON "SignupBan"("team_id");
CREATE INDEX "SignupBan_player_id_idx" ON "SignupBan"("player_id");
CREATE INDEX "SignupBan_via_ban_id_idx" ON "SignupBan"("via_ban_id");
ALTER TABLE "SignupBan" ADD CONSTRAINT "SignupBan_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignupBan" ADD CONSTRAINT "SignupBan_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignupBan" ADD CONSTRAINT "SignupBan_via_ban_id_fkey" FOREIGN KEY ("via_ban_id") REFERENCES "SignupBan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignupBan" ADD CONSTRAINT "SignupBan_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("tournament_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SignupBan" ADD CONSTRAINT "SignupBan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SignupBan" ADD CONSTRAINT "SignupBan_lifted_by_fkey" FOREIGN KEY ("lifted_by") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
