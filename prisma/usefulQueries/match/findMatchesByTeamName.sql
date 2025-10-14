-- Find marches by team name order them by date, display match id match date and team names
PREPARE find_matches_by_team_name(text) AS
SELECT m.id, m.match_date, t1.team_name, t2.team_name, m.round_id
FROM "Match" m
LEFT JOIN "Round" r ON r.id = m.round_id
LEFT JOIN "Team" t1 ON r.team1_id = t1.team_id
LEFT JOIN "Team" t2 ON r.team2_id = t2.team_id
WHERE t1.team_name ILIKE '%' || $1 || '%' OR t2.team_name ILIKE '%' || $1 || '%'
ORDER BY m.match_date;

EXECUTE find_matches_by_team_name('Dinamo');
DEALLOCATE find_matches_by_team_name;