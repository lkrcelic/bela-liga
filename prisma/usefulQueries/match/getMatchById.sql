PREPARE get_match_by_id(int) AS
SELECT m.id, m.match_date, t1.team_name, t2.team_name, m.round_id
FROM "Match" m
LEFT JOIN "Round" r ON r.id = m.round_id
LEFT JOIN "Team" t1 ON r.team1_id = t1.team_id
LEFT JOIN "Team" t2 ON r.team2_id = t2.team_id
WHERE m.id = $1;

EXECUTE get_match_by_id($1);
DEALLOCATE get_match_by_id;
