-- DropIndex
DROP INDEX "Session_id_key";

-- AlterTable
ALTER TABLE "Session"
    ALTER COLUMN "id" DROP DEFAULT,
ALTER
COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OngoingMatch"
(
    "id"              SERIAL NOT NULL,
    "round_id"        INTEGER,
    "player_pair_id1" INTEGER,
    "player_pair_id2" INTEGER,
    "score_threshold" INTEGER,
    "start_time"      TIMESTAMP(3),
    "end_time"        TIMESTAMP(3),
    "match_date"      TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OngoingMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OngoingBelaResult"
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

    CONSTRAINT "OngoingBelaResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "OngoingBelaPlayerAnnouncement"
(
    "announcement_id"   SERIAL                 NOT NULL,
    "result_id"         INTEGER                NOT NULL,
    "player_id"         INTEGER                NOT NULL,
    "announcement_type" "BelaAnnouncementEnum" NOT NULL,

    CONSTRAINT "OngoingBelaPlayerAnnouncement_pkey" PRIMARY KEY ("announcement_id")
);

-- AddForeignKey
ALTER TABLE "OngoingMatch"
    ADD CONSTRAINT "OngoingMatch_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "Round" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingMatch"
    ADD CONSTRAINT "OngoingMatch_player_pair_id1_fkey" FOREIGN KEY ("player_pair_id1") REFERENCES "PlayerPair" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingMatch"
    ADD CONSTRAINT "OngoingMatch_player_pair_id2_fkey" FOREIGN KEY ("player_pair_id2") REFERENCES "PlayerPair" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingBelaResult"
    ADD CONSTRAINT "OngoingBelaResult_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "OngoingMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingBelaResult"
    ADD CONSTRAINT "OngoingBelaResult_card_shuffler_id_fkey" FOREIGN KEY ("card_shuffler_id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingBelaResult"
    ADD CONSTRAINT "OngoingBelaResult_trump_caller_id_fkey" FOREIGN KEY ("trump_caller_id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingBelaPlayerAnnouncement"
    ADD CONSTRAINT "OngoingBelaPlayerAnnouncement_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "OngoingBelaResult" ("result_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OngoingBelaPlayerAnnouncement"
    ADD CONSTRAINT "OngoingBelaPlayerAnnouncement_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
