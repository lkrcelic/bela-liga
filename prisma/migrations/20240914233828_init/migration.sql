-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "GameEnum" AS ENUM ('BELA', 'TRESETA');

-- CreateEnum
CREATE TYPE "TrumpEnum" AS ENUM ('PIK', 'HERC', 'KARO', 'TREF');

-- CreateEnum
CREATE TYPE "BelaAnnouncementEnum" AS ENUM ('TWENTY', 'FIFTY', 'ONE_HUNDRED', 'ONE_HUNDRED_FIFTY', 'TWO_HUNDRED');

-- CreateEnum
CREATE TYPE "TresetaAnnouncementEnum" AS ENUM ('THREE', 'FOUR');

-- CreateEnum
CREATE TYPE "TrumpCallerPositionEnum" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH');

-- CreateTable
CREATE TABLE "Player"
(
    "id"              SERIAL       NOT NULL,
    "username"        VARCHAR(100) NOT NULL,
    "password_hash"   TEXT         NOT NULL,
    "email"           VARCHAR(100) NOT NULL,
    "player_role"     "RoleEnum"   NOT NULL,
    "first_name"      VARCHAR(100),
    "last_name"       VARCHAR(100),
    "birth_year"      INTEGER,
    "city"            VARCHAR(100),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3),

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session"
(
    "id"        UUID DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" TIMESTAMP,
    "userId"    INTEGER,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament"
(
    "tournament_id"   SERIAL       NOT NULL,
    "tournament_name" VARCHAR(100) NOT NULL,
    "game_type"       "GameEnum"   NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("tournament_id")
);

-- CreateTable
CREATE TABLE "League"
(
    "league_id"   SERIAL       NOT NULL,
    "league_name" VARCHAR(100) NOT NULL,
    "game_type"   "GameEnum"   NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("league_id")
);

-- CreateTable
CREATE TABLE "Team"
(
    "team_id"         SERIAL       NOT NULL,
    "team_name"       VARCHAR(100) NOT NULL,
    "founder_id1"     INTEGER,
    "founder_id2"     INTEGER,
    "creator_id"      INTEGER,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "TeamPlayer"
(
    "team_id"   INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,

    CONSTRAINT "TeamPlayer_pkey" PRIMARY KEY ("team_id", "player_id")
);

-- CreateTable
CREATE TABLE "TournamentTeam"
(
    "tournament_id" INTEGER NOT NULL,
    "team_id"       INTEGER NOT NULL,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("tournament_id", "team_id")
);

-- CreateTable
CREATE TABLE "LeagueTeam"
(
    "league_id" INTEGER NOT NULL,
    "team_id"   INTEGER NOT NULL,

    CONSTRAINT "LeagueTeam_pkey" PRIMARY KEY ("league_id", "team_id")
);

-- CreateTable
CREATE TABLE "Round"
(
    "id"           SERIAL NOT NULL,
    "round_number" INTEGER,
    "round_date"   TIMESTAMP(3),
    "team1_id"     INTEGER,
    "team2_id"     INTEGER,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentRound"
(
    "tournament_id" INTEGER NOT NULL,
    "round_id"      INTEGER NOT NULL,

    CONSTRAINT "TournamentRound_pkey" PRIMARY KEY ("tournament_id", "round_id")
);

-- CreateTable
CREATE TABLE "LeagueRound"
(
    "league_id" INTEGER NOT NULL,
    "round_id"  INTEGER NOT NULL,

    CONSTRAINT "LeagueRound_pkey" PRIMARY KEY ("league_id", "round_id")
);

-- CreateTable
CREATE TABLE "PlayerPair"
(
    "id"         SERIAL  NOT NULL,
    "player_id1" INTEGER NOT NULL,
    "player_id2" INTEGER NOT NULL,

    CONSTRAINT "PlayerPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match"
(
    "id"                 SERIAL NOT NULL,
    "round_id"           INTEGER,
    "player_pair1_score" INTEGER,
    "player_pair2_score" INTEGER,
    "player_pair_id1"    INTEGER,
    "player_pair_id2"    INTEGER,
    "score_threshold"    INTEGER,
    "start_time"         TIMESTAMP(3),
    "end_time"           TIMESTAMP(3),
    "match_date"         TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BelaResult"
(
    "result_id"                        SERIAL                    NOT NULL,
    "match_id"                         INTEGER                   NOT NULL,
    "player_pair1_game_points"         INTEGER                   NOT NULL DEFAULT 0,
    "player_pair2_game_points"         INTEGER                   NOT NULL DEFAULT 0,
    "player_pair1_announcement_points" INTEGER                   NOT NULL DEFAULT 0,
    "player_pair2_announcement_points" INTEGER                   NOT NULL DEFAULT 0,
    "card_shuffler_id"                 INTEGER,
    "trump_caller_id"                  INTEGER,
    "trump_caller_position"            "TrumpCallerPositionEnum" NOT NULL,
    "trump_type"                       "TrumpEnum",
    "pass"                             BOOLEAN                   NOT NULL DEFAULT false,
    "complete_victory"                 BOOLEAN                   NOT NULL DEFAULT false,

    CONSTRAINT "BelaResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "TresetaResult"
(
    "result_id"                        SERIAL  NOT NULL,
    "match_id"                         INTEGER NOT NULL,
    "player_pair1_game_points"         INTEGER NOT NULL DEFAULT 0,
    "player_pair2_game_points"         INTEGER NOT NULL DEFAULT 0,
    "player_pair1_announcement_points" INTEGER NOT NULL DEFAULT 0,
    "player_pair2_announcement_points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TresetaResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "BelaPlayerAnnouncement"
(
    "announcement_id"   SERIAL                 NOT NULL,
    "result_id"         INTEGER                NOT NULL,
    "player_id"         INTEGER                NOT NULL,
    "announcement_type" "BelaAnnouncementEnum" NOT NULL,

    CONSTRAINT "BelaPlayerAnnouncement_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateTable
CREATE TABLE "TresetaPlayerAnnouncement"
(
    "announcement_id"   SERIAL                    NOT NULL,
    "result_id"         INTEGER                   NOT NULL,
    "player_id"         INTEGER                   NOT NULL,
    "announcement_type" "TresetaAnnouncementEnum" NOT NULL,

    CONSTRAINT "TresetaPlayerAnnouncement_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player" ("username");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_team_name_key" ON "Team" ("team_name");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPair_player_id1_player_id2_key" ON "PlayerPair" ("player_id1", "player_id2");

--AddForeingKey
ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team"
    ADD CONSTRAINT "Team_founder_id1_fkey" FOREIGN KEY ("founder_id1") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team"
    ADD CONSTRAINT "Team_founder_id2_fkey" FOREIGN KEY ("founder_id2") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team"
    ADD CONSTRAINT "Team_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer"
    ADD CONSTRAINT "TeamPlayer_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPlayer"
    ADD CONSTRAINT "TeamPlayer_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam"
    ADD CONSTRAINT "TournamentTeam_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam"
    ADD CONSTRAINT "TournamentTeam_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueTeam"
    ADD CONSTRAINT "LeagueTeam_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League" ("league_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueTeam"
    ADD CONSTRAINT "LeagueTeam_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round"
    ADD CONSTRAINT "Round_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "Team" ("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round"
    ADD CONSTRAINT "Round_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "Team" ("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRound"
    ADD CONSTRAINT "TournamentRound_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRound"
    ADD CONSTRAINT "TournamentRound_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueRound"
    ADD CONSTRAINT "LeagueRound_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League" ("league_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueRound"
    ADD CONSTRAINT "LeagueRound_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPair"
    ADD CONSTRAINT "PlayerPair_player_id1_fkey" FOREIGN KEY ("player_id1") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPair"
    ADD CONSTRAINT "PlayerPair_player_id2_fkey" FOREIGN KEY ("player_id2") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match"
    ADD CONSTRAINT "Match_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Round" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match"
    ADD CONSTRAINT "Match_player_pair_id1_fkey" FOREIGN KEY ("player_pair_id1") REFERENCES "PlayerPair" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match"
    ADD CONSTRAINT "Match_player_pair_id2_fkey" FOREIGN KEY ("player_pair_id2") REFERENCES "PlayerPair" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelaResult"
    ADD CONSTRAINT "BelaResult_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelaResult"
    ADD CONSTRAINT "BelaResult_card_shuffler_id_fkey" FOREIGN KEY ("card_shuffler_id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelaResult"
    ADD CONSTRAINT "BelaResult_trump_caller_id_fkey" FOREIGN KEY ("trump_caller_id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TresetaResult"
    ADD CONSTRAINT "TresetaResult_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelaPlayerAnnouncement"
    ADD CONSTRAINT "BelaPlayerAnnouncement_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "BelaResult" ("result_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelaPlayerAnnouncement"
    ADD CONSTRAINT "BelaPlayerAnnouncement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TresetaPlayerAnnouncement"
    ADD CONSTRAINT "TresetaPlayerAnnouncement_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "TresetaResult" ("result_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TresetaPlayerAnnouncement"
    ADD CONSTRAINT "TresetaPlayerAnnouncement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
