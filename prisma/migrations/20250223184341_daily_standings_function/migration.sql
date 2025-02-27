CREATE OR REPLACE FUNCTION get_league_standings_by_date(
    p_league_id BIGINT,
    p_round_date DATE
)
RETURNS TABLE (
    team_id BIGINT,
    rounds_played INT,
    wins INT,
    draws INT,
    losses INT,
    point_difference INT,
    score INT
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    WITH round_results AS (
        -- Calculate rounds, wins, draws, losses from both team perspectives
        SELECT team_id, SUM(rounds_played) AS rounds_played,
               SUM(wins) AS wins, SUM(draws) AS draws, SUM(losses) AS losses
        FROM (
            -- As team1
            SELECT r.team1_id AS team_id,
                   COUNT(*) AS rounds_played,
                   COUNT(CASE WHEN r.team1_wins > r.team2_wins THEN 1 END) AS wins,
                   COUNT(CASE WHEN r.team1_wins = r.team2_wins THEN 1 END) AS draws,
                   COUNT(CASE WHEN r.team1_wins < r.team2_wins THEN 1 END) AS losses
            FROM "Round" r
            JOIN "LeagueRound" lr ON r.id = lr.round_id
            WHERE lr.league_id = p_league_id
              AND r.round_date = p_round_date
            GROUP BY r.team1_id

            UNION ALL

            -- As team2
            SELECT r.team2_id AS team_id,
                   COUNT(*) AS rounds_played,
                   COUNT(CASE WHEN r.team2_wins > r.team1_wins THEN 1 END) AS wins,
                   COUNT(CASE WHEN r.team2_wins = r.team1_wins THEN 1 END) AS draws,
                   COUNT(CASE WHEN r.team2_wins < r.team1_wins THEN 1 END) AS losses
            FROM "Round" r
            JOIN "LeagueRound" lr ON r.id = lr.round_id
            WHERE lr.league_id = p_league_id
              AND r.round_date = p_round_date
            GROUP BY r.team2_id
        ) AS sub
        GROUP BY team_id
    ),
    match_points AS (
        -- Calculate the point difference from matches for both team perspectives
        SELECT team_id, COALESCE(SUM(team_score - opponent_score), 0) AS point_difference
        FROM (
            -- As team1
            SELECT r.team1_id AS team_id,
                   SUM(m.player_pair1_score) AS team_score,
                   SUM(m.player_pair2_score) AS opponent_score
            FROM "Round" r
            JOIN "LeagueRound" lr ON r.id = lr.round_id
            JOIN "Match" m ON r.id = m.round_id
            WHERE lr.league_id = p_league_id
              AND r.round_date = p_round_date
            GROUP BY r.team1_id

            UNION ALL

            -- As team2
            SELECT r.team2_id AS team_id,
                   SUM(m.player_pair2_score) AS team_score,
                   SUM(m.player_pair1_score) AS opponent_score
            FROM "Round" r
            JOIN "LeagueRound" lr ON r.id = lr.round_id
            JOIN "Match" m ON r.id = m.round_id
            WHERE lr.league_id = p_league_id
              AND r.round_date = p_round_date
            GROUP BY r.team2_id
        ) AS mp
        GROUP BY team_id
    )
-- Combine the round results with the match points,
-- calculate the total score and sort the standings.
SELECT
    rr.team_id,
    rr.rounds_played,
    rr.wins,
    rr.draws,
    rr.losses,
    mp.point_difference,
    (rr.wins * 3 + rr.draws) AS score
FROM round_results rr
         LEFT JOIN match_points mp ON rr.team_id = mp.team_id
ORDER BY score DESC, mp.point_difference DESC;
END;
$$;
