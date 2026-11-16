// seed:verify — the rules every Bela database must keep, checked with the app's own scoring functions.
// On the generated world any broken rule stops the run (exit 1), so no test runs on bad data.
// With --report (a production copy) it prints how many rows break each rule, with a few ids, and exits 0: real data
// has old rows typed in by hand, and the point there is to see them.
// It only reads, so it may point at any copy.
import {ANNOUNCEMENT_POINTS, computeHandTotals, gamePointsError, matchWinner} from "@/app/_lib/bela/scoring";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {prisma} from "@/app/_lib/prisma";

type Finding = {rule: string; bad: number; examples: (number | string)[]};

const findings: Finding[] = [];
function record(rule: string, bad: (number | string)[]) {
  findings.push({rule, bad: bad.length, examples: bad.slice(0, 5)});
}

async function hands() {
  const rows = await prisma.belaResult.findMany({include: {belaPlayerAnnouncements: true}});
  const badPoints: number[] = [];
  const badAnnouncements: number[] = [];
  const badTotals: number[] = [];
  for (const r of rows) {
    if (r.trump_caller_team == null) continue; // a manual hand from the admin's Ručni unos: totals only
    if (gamePointsError(r.player_pair1_game_points, r.player_pair2_game_points, r.complete_victory)) badPoints.push(r.result_id);
    const sum = (team: number) =>
      r.belaPlayerAnnouncements.filter((a) => a.team === team).reduce((s, a) => s + ANNOUNCEMENT_POINTS[a.announcement_type], 0);
    if (sum(1) !== r.player_pair1_announcement_points || sum(2) !== r.player_pair2_announcement_points) badAnnouncements.push(r.result_id);
    const totals = computeHandTotals({
      gamePoints1: r.player_pair1_game_points,
      gamePoints2: r.player_pair2_game_points,
      announcementPoints1: r.player_pair1_announcement_points,
      announcementPoints2: r.player_pair2_announcement_points,
      trumpCaller: r.trump_caller_team as 1 | 2,
      completeVictory: r.complete_victory,
    });
    if (totals.totalPoints1 !== r.player_pair1_total_points || totals.totalPoints2 !== r.player_pair2_total_points || totals.pass !== r.pass) {
      badTotals.push(r.result_id);
    }
  }
  record("igra: bodovi igre su 162 (ili 252:0 za štiglju)", badPoints);
  record("igra: bodovi zvanja = zbroj upisanih zvanja", badAnnouncements);
  record("igra: ukupno i prolaz/pad kako ih računa computeHandTotals", badTotals);
}

async function matches() {
  const rows = await prisma.$queryRaw<
    {id: number; s1: number; s2: number; threshold: number | null; time_expired: boolean; n: bigint; t1: bigint; t2: bigint; bye: boolean; no_show: boolean}[]
  >`
    SELECT m.id, m.player_pair1_score s1, m.player_pair2_score s2, m.score_threshold threshold, m.time_expired,
           count(b.result_id) n, coalesce(sum(b.player_pair1_total_points), 0) t1, coalesce(sum(b.player_pair2_total_points), 0) t2,
           coalesce(r.team1_id = ${BYE_TEAM_ID} OR r.team2_id = ${BYE_TEAM_ID}, false) bye, coalesce(r.attendance = 'NO_SHOW', false) no_show
    FROM "Match" m LEFT JOIN "BelaResult" b ON b.match_id = m.id LEFT JOIN "Round" r ON r.id = m.round_id
    GROUP BY m.id, r.team1_id, r.team2_id, r.attendance`;
  const sums: number[] = [];
  const winners: number[] = [];
  const empty: number[] = [];
  for (const m of rows) {
    if (Number(m.n) === 0) {
      const byeScore = m.bye && ((m.s1 === 301 && m.s2 === 0) || (m.s1 === 0 && m.s2 === 301));
      const noShowScore = m.no_show && ((m.s1 === 1001 && m.s2 === 700) || (m.s1 === 700 && m.s2 === 1001));
      if (!byeScore && !noShowScore) empty.push(m.id);
      continue;
    }
    if (Number(m.t1) !== m.s1 || Number(m.t2) !== m.s2) sums.push(m.id);
    const done = m.time_expired ? m.s1 !== m.s2 : matchWinner(m.s1, m.s2, m.threshold ?? 1001) !== null;
    if (!done) winners.push(m.id);
  }
  record("meč: rezultat = zbroj igara", sums);
  record("meč: ima pobjednika (1001 i različito, ili isteklo vrijeme i različito)", winners);
  record("meč bez igara je samo bye (301:0) ili nedolazak (1001:700)", empty);
}

async function tables() {
  const wins = await prisma.$queryRaw<{id: number}[]>`
    SELECT r.id FROM "Round" r LEFT JOIN "Match" m ON m.round_id = r.id
    WHERE r.open = false AND r.status = 'PUBLISHED' AND r.attendance IS DISTINCT FROM 'SKIPPED'
    GROUP BY r.id
    HAVING count(m.id) <> r.matches_per_round
        OR r.team1_wins <> count(m.id) FILTER (WHERE m.player_pair1_score > m.player_pair2_score)
        OR r.team2_wins <> count(m.id) FILTER (WHERE m.player_pair2_score > m.player_pair1_score)`;
  record("zatvoren stol: broj mečeva = partija po kolu, pobjede = dobiveni mečevi", wins.map((r) => r.id));

  const twice = await prisma.$queryRaw<{team: number; round_date: Date; round_number: number}[]>`
    WITH seats AS (
      SELECT r.id, r.round_date, r.round_number, coalesce(lr.league_id, -tr.tournament_id) comp, t.team
      FROM "Round" r
      LEFT JOIN "LeagueRound" lr ON lr.round_id = r.id
      LEFT JOIN "TournamentRound" tr ON tr.round_id = r.id
      CROSS JOIN LATERAL (VALUES (r.team1_id), (r.team2_id)) t(team)
      WHERE t.team <> ${BYE_TEAM_ID})
    SELECT team, round_date, round_number FROM seats GROUP BY comp, team, round_date, round_number HAVING count(*) > 1`;
  record("ekipa sjedi za najviše jednim stolom u kolu", twice.map((t) => `${t.team}@${t.round_number}`));

  const both = await prisma.$queryRaw<{round_id: number}[]>`
    SELECT round_id FROM "RoundPlayer" GROUP BY round_id, player_id HAVING count(DISTINCT team_id) > 1`;
  record("nitko ne igra za obje ekipe istog stola", both.map((r) => r.round_id));

  const nights = await prisma.$queryRaw<{id: number}[]>`
    SELECT r.id FROM "Round" r JOIN "LeagueRound" lr ON lr.round_id = r.id
    WHERE NOT EXISTS (SELECT 1 FROM "LeagueNight" n WHERE n.league_id = lr.league_id AND n.night = r.round_date)`;
  record("stol lige je na večeri lige (LeagueNight)", nights.map((r) => r.id));
}

async function standings() {
  // what update_team_score would write, from the published closed tables
  const rows = await prisma.$queryRaw<{team_id: number; league_id: number}[]>`
    WITH t AS (
      SELECT lr.league_id, x.team, x.mine, x.theirs, x.diff
      FROM "Round" r JOIN "LeagueRound" lr ON lr.round_id = r.id
      CROSS JOIN LATERAL (VALUES
        (r.team1_id, r.team1_wins, r.team2_wins, (SELECT coalesce(sum(m.player_pair1_score - m.player_pair2_score), 0) FROM "Match" m WHERE m.round_id = r.id)),
        (r.team2_id, r.team2_wins, r.team1_wins, (SELECT coalesce(sum(m.player_pair2_score - m.player_pair1_score), 0) FROM "Match" m WHERE m.round_id = r.id))
      ) x(team, mine, theirs, diff)
      WHERE r.open = false AND r.status = 'PUBLISHED' AND x.team <> ${BYE_TEAM_ID}),
    agg AS (
      SELECT league_id, team, count(*) played, count(*) FILTER (WHERE mine > theirs) wins,
             count(*) FILTER (WHERE mine = theirs) draws, sum(diff) diff
      FROM t GROUP BY league_id, team)
    SELECT s.team_id, s.league_id FROM "TeamScore" s
    LEFT JOIN agg a ON a.league_id = s.league_id AND a.team = s.team_id
    WHERE s.league_id IS NOT NULL AND s.team_id <> ${BYE_TEAM_ID}
      AND (s.rounds_played <> coalesce(a.played, 0) OR s.wins <> coalesce(a.wins, 0) OR s.draws <> coalesce(a.draws, 0)
           OR s.point_difference <> coalesce(a.diff, 0) OR s.score <> 2 * coalesce(a.wins, 0) + coalesce(a.draws, 0))`;
  record("poredak lige (TeamScore) = zbroj zatvorenih objavljenih stolova", rows.map((r) => `${r.team_id}@${r.league_id}`));

  const ratings = await prisma.$queryRaw<{player_id: number}[]>`
    SELECT h.player_id FROM "PlayerRatingHistory" h JOIN "Player" p ON p.id = h.player_id
    WHERE h.night = (SELECT max(night) FROM "PlayerRatingHistory" x WHERE x.player_id = h.player_id) AND h.rating <> p.rating`;
  record("rejting: zadnji zapis povijesti = trenutni rejting igrača", ratings.map((r) => r.player_id));

  const range = await prisma.player.findMany({where: {OR: [{rating: {lt: 500}}, {rating: {gt: 2500}}]}, select: {id: true}});
  record("rejting je između 500 i 2500", range.map((p) => p.id));
}

async function tournaments() {
  const over = await prisma.$queryRaw<{tournament_id: number}[]>`
    SELECT t.tournament_id FROM "Tournament" t JOIN "TournamentTeam" e ON e.tournament_id = t.tournament_id
    WHERE t.max_teams IS NOT NULL AND e.status = 'REGISTERED' AND t.started_at IS NULL
    GROUP BY t.tournament_id, t.max_teams HAVING count(*) > t.max_teams`;
  record("turnir prije početka nema više prijavljenih od limita", over.map((t) => t.tournament_id));

  const waitingWithRoom = await prisma.$queryRaw<{tournament_id: number}[]>`
    SELECT t.tournament_id FROM "Tournament" t
    WHERE t.started_at IS NULL AND t.cancelled_at IS NULL AND t.max_teams IS NOT NULL
      AND EXISTS (SELECT 1 FROM "TournamentTeam" w WHERE w.tournament_id = t.tournament_id AND w.status = 'WAITING')
      AND (SELECT count(*) FROM "TournamentTeam" r WHERE r.tournament_id = t.tournament_id AND r.status = 'REGISTERED') < t.max_teams`;
  record("nitko ne čeka na listi dok ima mjesta", waitingWithRoom.map((t) => t.tournament_id));

  const playerTwice = await prisma.$queryRaw<{tournament_id: number}[]>`
    SELECT e.tournament_id FROM "TournamentTeam" e JOIN "TeamPlayer" tp ON tp.team_id = e.team_id
    GROUP BY e.tournament_id, tp.player_id HAVING count(*) > 1`;
  record("igrač je u najviše jednoj ekipi istog turnira", playerTwice.map((t) => t.tournament_id));
}

async function main() {
  const report = process.argv.includes("--report");
  const started = Date.now();
  await hands();
  await matches();
  await tables();
  await standings();
  await tournaments();
  await prisma.$disconnect();

  const broken = findings.filter((f) => f.bad > 0);
  for (const f of findings) {
    const mark = f.bad === 0 ? "✓" : report ? "!" : "✗";
    console.log(`${mark} ${f.rule}${f.bad ? ` — ${f.bad} (npr. ${f.examples.join(", ")})` : ""}`);
  }
  console.log(`${findings.length - broken.length}/${findings.length} pravila drže · ${((Date.now() - started) / 1000).toFixed(1)} s`);
  if (broken.length > 0 && !report) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
