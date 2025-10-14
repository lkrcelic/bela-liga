PREPARE insert_round(int, int, int) AS
WITH new_round AS (
  INSERT INTO "Round" (
    round_number, round_date, team1_id, team2_id, team1_wins, team2_wins, open, active, table_number
  )
  VALUES ($1, CURRENT_DATE, $2, $3, 0, 0, TRUE, FALSE, NULL)
  RETURNING id
)
INSERT INTO "LeagueRound" (league_id, round_id)
SELECT 1, id
FROM new_round;

-- insert round (round_number, team1_id, team2_id)
EXECUTE insert_round(1, 1, 1);
DEALLOCATE insert_round;