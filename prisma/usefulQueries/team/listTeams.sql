SELECT
  t.team_id,
  t.team_name,
  t.founder_id1 AS founder1_id,
  f1.username   AS founder1_name,
  t.founder_id2 AS founder2_id,
  f2.username   AS founder2_name
FROM "Team" t
LEFT JOIN "Player" f1 ON t.founder_id1 = f1.id
LEFT JOIN "Player" f2 ON t.founder_id2 = f2.id
ORDER BY t.team_name;
