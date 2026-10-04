/*
  Seating order, card dealer (shuffler), player pairs and player-level trump callers / announcements
  are no longer tracked. A match is played between round.team1 and round.team2 only.

  - Results keep which TEAM called trump (`trump_caller_team`: 1 = team1, 2 = team2).
  - Announcements keep which TEAM declared them (`team`: 1 = team1, 2 = team2).
  Existing data is converted from player ids to teams via the match's player pairs (falling back to the
  round's team rosters) before the player-level columns are dropped. A trump caller that can't be placed stays
  empty; an announcement that can't be placed is deleted (only the hand's detail; its points stay).

  Warnings:
  - Drops `OngoingMatch.seating_order_ids`, `OngoingMatch.current_shuffler_index`, the shuffler trigger,
    `player_pair_id1/2` on `Match` and `OngoingMatch`, and the `PlayerPair` table.
  - Drops `card_shuffler_id`, `trump_caller_id`, `trump_caller_position` on `BelaResult` and `OngoingBelaResult`.
  - Drops `player_id` on `BelaPlayerAnnouncement` and `OngoingBelaPlayerAnnouncement`.
*/

-- Which team called trump
ALTER TABLE "OngoingBelaResult" ADD COLUMN "trump_caller_team" INTEGER;
ALTER TABLE "BelaResult" ADD COLUMN "trump_caller_team" INTEGER;

UPDATE "OngoingBelaResult" r
SET trump_caller_team = CASE
                            WHEN r.trump_caller_id IN (pp1.player_id1, pp1.player_id2) THEN 1
                            WHEN r.trump_caller_id IN (pp2.player_id1, pp2.player_id2) THEN 2
    END
FROM "OngoingMatch" m
         LEFT JOIN "PlayerPair" pp1 ON pp1.id = m.player_pair_id1
         LEFT JOIN "PlayerPair" pp2 ON pp2.id = m.player_pair_id2
WHERE m.id = r.match_id;

UPDATE "BelaResult" r
SET trump_caller_team = CASE
                            WHEN r.trump_caller_id IN (pp1.player_id1, pp1.player_id2) THEN 1
                            WHEN r.trump_caller_id IN (pp2.player_id1, pp2.player_id2) THEN 2
    END
FROM "Match" m
         LEFT JOIN "PlayerPair" pp1 ON pp1.id = m.player_pair_id1
         LEFT JOIN "PlayerPair" pp2 ON pp2.id = m.player_pair_id2
WHERE m.id = r.match_id;

ALTER TABLE "OngoingBelaResult"
    ADD CONSTRAINT "chk_ongoing_trump_caller_team" CHECK (trump_caller_team IN (1, 2));
ALTER TABLE "BelaResult"
    ADD CONSTRAINT "chk_trump_caller_team" CHECK (trump_caller_team IN (1, 2));

-- Which team declared each announcement
ALTER TABLE "OngoingBelaPlayerAnnouncement" ADD COLUMN "team" INTEGER;
ALTER TABLE "BelaPlayerAnnouncement" ADD COLUMN "team" INTEGER;

UPDATE "OngoingBelaPlayerAnnouncement" a
SET team = CASE
               WHEN a.player_id IN (pp1.player_id1, pp1.player_id2) THEN 1
               WHEN a.player_id IN (pp2.player_id1, pp2.player_id2) THEN 2
    END
FROM "OngoingBelaResult" r
         JOIN "OngoingMatch" m ON m.id = r.match_id
         LEFT JOIN "PlayerPair" pp1 ON pp1.id = m.player_pair_id1
         LEFT JOIN "PlayerPair" pp2 ON pp2.id = m.player_pair_id2
WHERE r.result_id = a.result_id;

UPDATE "BelaPlayerAnnouncement" a
SET team = CASE
               WHEN a.player_id IN (pp1.player_id1, pp1.player_id2) THEN 1
               WHEN a.player_id IN (pp2.player_id1, pp2.player_id2) THEN 2
    END
FROM "BelaResult" r
         JOIN "Match" m ON m.id = r.match_id
         LEFT JOIN "PlayerPair" pp1 ON pp1.id = m.player_pair_id1
         LEFT JOIN "PlayerPair" pp2 ON pp2.id = m.player_pair_id2
WHERE r.result_id = a.result_id;

-- Fallback for matches without player pairs: use the round's team rosters
UPDATE "OngoingBelaPlayerAnnouncement" a
SET team = CASE
               WHEN EXISTS (SELECT 1 FROM "TeamPlayer" tp WHERE tp.team_id = rd.team1_id AND tp.player_id = a.player_id) THEN 1
               WHEN EXISTS (SELECT 1 FROM "TeamPlayer" tp WHERE tp.team_id = rd.team2_id AND tp.player_id = a.player_id) THEN 2
    END
FROM "OngoingBelaResult" r
         JOIN "OngoingMatch" m ON m.id = r.match_id
         JOIN "Round" rd ON rd.id = m.round_id
WHERE r.result_id = a.result_id
  AND a.team IS NULL;

UPDATE "BelaPlayerAnnouncement" a
SET team = CASE
               WHEN EXISTS (SELECT 1 FROM "TeamPlayer" tp WHERE tp.team_id = rd.team1_id AND tp.player_id = a.player_id) THEN 1
               WHEN EXISTS (SELECT 1 FROM "TeamPlayer" tp WHERE tp.team_id = rd.team2_id AND tp.player_id = a.player_id) THEN 2
    END
FROM "BelaResult" r
         JOIN "Match" m ON m.id = r.match_id
         JOIN "Round" rd ON rd.id = m.round_id
WHERE r.result_id = a.result_id
  AND a.team IS NULL;

-- What still has no team can't be placed: the match has no player pairs and the player is on neither team's roster
-- any more (production had 77, all in finished matches). Only hand detail is lost: the hands keep their points and
-- totals, and match scores, round results and standings don't read announcements.
DELETE FROM "OngoingBelaPlayerAnnouncement" WHERE team IS NULL;
DELETE FROM "BelaPlayerAnnouncement" WHERE team IS NULL;

ALTER TABLE "OngoingBelaPlayerAnnouncement" ALTER COLUMN "team" SET NOT NULL;
ALTER TABLE "BelaPlayerAnnouncement" ALTER COLUMN "team" SET NOT NULL;

ALTER TABLE "OngoingBelaPlayerAnnouncement"
    ADD CONSTRAINT "chk_ongoing_announcement_team" CHECK (team IN (1, 2));
ALTER TABLE "BelaPlayerAnnouncement"
    ADD CONSTRAINT "chk_announcement_team" CHECK (team IN (1, 2));

-- Card dealer rotation
DROP TRIGGER IF EXISTS trg_update_shuffler_index_on_new_result ON "OngoingBelaResult";
DROP FUNCTION IF EXISTS update_shuffler_index_on_new_result();

-- DropForeignKey
ALTER TABLE "BelaPlayerAnnouncement" DROP CONSTRAINT "BelaPlayerAnnouncement_player_id_fkey";

-- DropForeignKey
ALTER TABLE "OngoingBelaPlayerAnnouncement" DROP CONSTRAINT "OngoingBelaPlayerAnnouncement_player_id_fkey";

-- DropForeignKey
ALTER TABLE "BelaResult" DROP CONSTRAINT "BelaResult_card_shuffler_id_fkey";

-- DropForeignKey
ALTER TABLE "BelaResult" DROP CONSTRAINT "BelaResult_trump_caller_id_fkey";

-- DropForeignKey
ALTER TABLE "OngoingBelaResult" DROP CONSTRAINT "OngoingBelaResult_card_shuffler_id_fkey";

-- DropForeignKey
ALTER TABLE "OngoingBelaResult" DROP CONSTRAINT "OngoingBelaResult_trump_caller_id_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_player_pair_id1_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_player_pair_id2_fkey";

-- DropForeignKey
ALTER TABLE "OngoingMatch" DROP CONSTRAINT "OngoingMatch_player_pair_id1_fkey";

-- DropForeignKey
ALTER TABLE "OngoingMatch" DROP CONSTRAINT "OngoingMatch_player_pair_id2_fkey";

-- DropForeignKey
ALTER TABLE "PlayerPair" DROP CONSTRAINT "PlayerPair_player_id1_fkey";

-- DropForeignKey
ALTER TABLE "PlayerPair" DROP CONSTRAINT "PlayerPair_player_id2_fkey";

-- AlterTable
ALTER TABLE "BelaPlayerAnnouncement" DROP COLUMN "player_id";

-- AlterTable
ALTER TABLE "OngoingBelaPlayerAnnouncement" DROP COLUMN "player_id";

-- AlterTable
ALTER TABLE "BelaResult" DROP COLUMN "card_shuffler_id",
DROP COLUMN "trump_caller_id",
DROP COLUMN "trump_caller_position";

-- AlterTable
ALTER TABLE "OngoingBelaResult" DROP COLUMN "card_shuffler_id",
DROP COLUMN "trump_caller_id",
DROP COLUMN "trump_caller_position";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "player_pair_id1",
DROP COLUMN "player_pair_id2";

-- AlterTable (also drops the chk_current_shuffler_index_range constraint)
ALTER TABLE "OngoingMatch" DROP COLUMN "current_shuffler_index",
DROP COLUMN "player_pair_id1",
DROP COLUMN "player_pair_id2",
DROP COLUMN "seating_order_ids";

-- DropTable
DROP TABLE "PlayerPair";

-- DropEnum
DROP TYPE "TrumpCallerPositionEnum";
