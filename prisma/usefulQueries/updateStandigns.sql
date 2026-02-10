-- 1. Find and delete corrupted LeagueRound entries
-- These are rounds that belong to league X but are incorrectly linked to league Y
-- A round is wrongly linked if its teams are NOT part of that league
DELETE FROM "LeagueRound" lr
WHERE NOT EXISTS (
    SELECT 1
    FROM "Round" r
    JOIN "LeagueTeam" lt1 ON lt1.team_id = r.team1_id AND lt1.league_id = lr.league_id
    WHERE r.id = lr.round_id
);

-- 2. Recompute league standings for league_id = 2
DO $$
DECLARE
rec RECORD;
BEGIN
FOR rec IN
SELECT team_id
FROM "LeagueTeam"
WHERE league_id = 2
    LOOP
        EXECUTE format('CALL update_team_score(%s, 2)', rec.team_id);
END LOOP;
END $$;
