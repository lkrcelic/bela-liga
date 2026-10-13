-- Test data for Burza igrača. LOCAL / TEST DATABASES ONLY — never run it on production.
--
-- Makes a league "Burza test" with a night every Wednesday from this week to the end of next year, puts 10 teams in it
-- (team 29 "Puleni", the local test player rf_player's team, plus the 9 teams with the most players), and adds ads:
--   - 7 substitute ads (Treba zamjena) on the next nights, by members of those teams, each with a suigrač;
--   - 3 partner ads (Traži partnera) and 4 availability ads (Dostupan sam);
--   - for the author of team 29's ads: one closed and one expired ad, so Moji oglasi has something under Prošli.
-- Phones are fake: "+385 9x 000 0nnn". Every ad's note starts with "[test]".
--
-- Run it again to start over: it removes its own league (and with it the league's ads) and the "[test]" ads first.
-- To remove everything:
--   DELETE FROM "MarketPost" WHERE note LIKE '[test]%';
--   DELETE FROM "League" WHERE league_name = 'Burza test';

BEGIN;

DELETE FROM "MarketPost" WHERE note LIKE '[test]%';
DELETE FROM "League" WHERE league_name = 'Burza test';

-- the league, with Wednesday nights (play_day 2 = Wednesday), one of them already past for the expired ad
INSERT INTO "League" (league_name, season, start_date, end_date, play_day, rounds_per_night)
VALUES ('Burza test', 'test', date_trunc('week', current_date)::date - 5, (date_trunc('year', current_date) + interval '2 years - 1 day')::date, 2, 3);

INSERT INTO "LeagueNight" (league_id, night)
SELECT l.league_id, n::date
FROM "League" l,
     generate_series(date_trunc('week', current_date)::date - 5, (date_trunc('year', current_date) + interval '2 years - 1 day')::date, interval '7 days') n
WHERE l.league_name = 'Burza test';

-- team 29 and the 9 other teams (not the bye) with the most active players
INSERT INTO "LeagueTeam" (league_id, team_id)
SELECT (SELECT league_id FROM "League" WHERE league_name = 'Burza test'), t.team_id
FROM (
  SELECT tp.team_id
  FROM "TeamPlayer" tp JOIN "Player" p ON p.id = tp.player_id
  WHERE tp.team_id <> 0 AND p.active AND p.deleted_at IS NULL
  GROUP BY tp.team_id
  HAVING count(*) >= 2
  ORDER BY (tp.team_id = 29) DESC, count(*) DESC, tp.team_id
  LIMIT 10
) t;

-- substitute ads: team i asks for night i % 3 (the next three nights), written by its first player, with its second
-- player as the suigrač. Team 29's ad is written by rf_player when that account exists.
WITH league AS (SELECT league_id FROM "League" WHERE league_name = 'Burza test'),
nights AS (
  SELECT night, row_number() OVER (ORDER BY night) - 1 AS i
  FROM "LeagueNight" WHERE league_id = (SELECT league_id FROM league) AND night >= current_date
),
teams AS (
  SELECT lt.team_id, row_number() OVER (ORDER BY (lt.team_id = 29) DESC, lt.team_id) - 1 AS i
  FROM "LeagueTeam" lt WHERE lt.league_id = (SELECT league_id FROM league)
),
members AS (
  SELECT tp.team_id, p.id,
         row_number() OVER (PARTITION BY tp.team_id ORDER BY (p.username = 'rf_player') DESC, p.id) AS r
  FROM "TeamPlayer" tp JOIN "Player" p ON p.id = tp.player_id
  WHERE p.active AND p.deleted_at IS NULL
)
INSERT INTO "MarketPost" (kind, player_id, league_id, team_id, night, with_player_id, phone, note, created_at)
SELECT 'SUBSTITUTE', a.id, (SELECT league_id FROM league), t.team_id, n.night, w.id,
       '+385 9' || (1 + t.i % 8) || ' 000 0' || lpad((100 + t.i)::text, 3, '0'),
       '[test] ' || (ARRAY['Igramo od 19 h, javi se do srijede.', 'Trebamo nekoga tko zna brzo brojati.', '', 'Može i početnik.', 'Javi se na WhatsApp.', '', 'Plaćamo prvu rundu.'])[1 + t.i % 7],
       now() - (t.i * interval '3 hours')
FROM teams t
JOIN nights n ON n.i = t.i % 3
JOIN members a ON a.team_id = t.team_id AND a.r = 1
JOIN members w ON w.team_id = t.team_id AND w.r = 2
WHERE t.i < 7;

-- partner ads: players of teams 8–10 in the league
WITH league AS (SELECT league_id FROM "League" WHERE league_name = 'Burza test'),
last_player AS (
  SELECT DISTINCT ON (lt.team_id) lt.team_id, p.id
  FROM "LeagueTeam" lt JOIN "TeamPlayer" tp ON tp.team_id = lt.team_id JOIN "Player" p ON p.id = tp.player_id
  WHERE lt.league_id = (SELECT league_id FROM league) AND lt.team_id <> 29 AND p.active AND p.deleted_at IS NULL
  ORDER BY lt.team_id DESC, p.id DESC
  LIMIT 3
),
authors AS (SELECT id, row_number() OVER (ORDER BY team_id DESC) AS i FROM last_player)
INSERT INTO "MarketPost" (kind, player_id, league_id, phone, note, created_at)
SELECT 'PARTNER', a.id, (SELECT league_id FROM league), '+385 95 000 0' || lpad((200 + a.i)::text, 3, '0'),
       '[test] ' || (ARRAY['Tražim stalnog partnera za ovu sezonu, igram srijedom.', 'Iskusan igrač, tražim nekoga za cijelu ligu.', 'Novi u ligi, tražim partnera.'])[a.i],
       now() - (a.i * interval '1 day')
FROM authors a;

-- availability ads: active players who are in no team of the league
INSERT INTO "MarketPost" (kind, player_id, as_substitute, as_partner, phone, note, created_at)
SELECT 'AVAILABLE', p.id, x.i <> 3, x.i >= 3, '+385 98 000 0' || lpad((300 + x.i)::text, 3, '0'),
       '[test] ' || (ARRAY['Slobodan srijedom navečer.', 'Mogu uskočiti bilo koji tjedan.', '', 'Tražim novu ekipu.'])[x.i],
       now() - (x.i * interval '5 hours')
FROM (
  SELECT p.id, row_number() OVER (ORDER BY p.id) AS i
  FROM "Player" p
  WHERE p.active AND p.deleted_at IS NULL AND p.player_role = 'PLAYER'
    AND NOT EXISTS (SELECT 1 FROM "MarketPost" m WHERE m.player_id = p.id AND m.kind = 'AVAILABLE' AND m.closed_at IS NULL)
    AND NOT EXISTS (
      SELECT 1 FROM "TeamPlayer" tp JOIN "LeagueTeam" lt ON lt.team_id = tp.team_id
      WHERE tp.player_id = p.id AND lt.league_id = (SELECT league_id FROM "League" WHERE league_name = 'Burza test'))
  LIMIT 4
) x JOIN "Player" p ON p.id = x.id;

-- Prošli for the author of team 29's ad: one closed yesterday, one whose night has passed
INSERT INTO "MarketPost" (kind, player_id, league_id, team_id, night, with_player_id, phone, note, created_at, closed_at)
SELECT m.kind, m.player_id, m.league_id, m.team_id, v.night, m.with_player_id, m.phone, '[test] ' || v.note, v.created, v.closed
FROM "MarketPost" m
CROSS JOIN LATERAL (VALUES
  ((SELECT max(night) FROM "LeagueNight" WHERE league_id = m.league_id AND night < current_date), 'Prošli tjedan.', now() - interval '9 days', NULL::timestamp),
  ((SELECT min(night) FROM "LeagueNight" WHERE league_id = m.league_id AND night > m.night), 'Zatvoren, našli smo zamjenu.', now() - interval '2 days', now() - interval '1 day')
) v(night, note, created, closed)
WHERE m.note LIKE '[test]%' AND m.kind = 'SUBSTITUTE' AND m.team_id = 29;

COMMIT;

-- what was made
SELECT kind, count(*) FILTER (WHERE closed_at IS NULL) AS open, count(*) FILTER (WHERE closed_at IS NOT NULL) AS closed
FROM "MarketPost" WHERE note LIKE '[test]%' GROUP BY kind ORDER BY kind;
