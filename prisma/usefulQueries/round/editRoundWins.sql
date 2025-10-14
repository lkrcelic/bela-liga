-- Edit round wins by round id
PREPARE edit_round_wins_by_round_id(int, int, int) AS
UPDATE "Round"
SET team1_wins = $2,
    team2_wins = $3
WHERE id = $1;

-- (round id, team1 wins, team2 wins)
EXECUTE edit_round_wins_by_round_id($1, $2, $3);
DEALLOCATE edit_round_wins_by_round_id;
