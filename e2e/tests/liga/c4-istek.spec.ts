// C4 · Vrijeme partije, when a match's time runs out (DECISIONS #83, CHANGELOG 07.11. and 14.11.): the match closes
// with the score entered then and the team with more points wins it, on the first read after the deadline (the board
// itself, a reload, or the scheduler's /api/cron/tick), and the table goes on to Meč 2 on a fresh clock or to Kraj
// kola. A hand saved after the deadline doesn't count; with the score level one more hand is played, and it ends the
// match.
// Each test plays its own one-table Kolo of tonight in "E2E · Scorepad" for the teams of tables.timeLimit
// (helpers/c4.ts: published as the admin does, Tko igra, the first match started with the league's 35 minutes), with
// hands saved from a teammate's phone; the deadline is moved in the database. The fixture removes the Kolo afterwards
// and the server recounts the standings.
// A hand is 162 game points; the caller must score more than the other team (game points + zvanja), else it is pad.
import {expect, expectRoundWins, expectTimer, moveDeadline, test, tick, type OwnTable} from "../../helpers/c4";
import {addHands, expectTotal, fillHand, handRows} from "../../helpers/scorepad";
import type {Db} from "../../helpers/db";
import {expectHealthy, watch} from "../../helpers/health";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GAME_MINUTES = 35;

// Meč 1's three hands, home ahead: 100 : 62, away's 90 + bela 20 against 72 (72 : 110), then 152 : 10 → 324 : 182
const homeAhead = (t: OwnTable) => [t.hand("home", 100), t.hand("away", 90, [20]), t.hand("home", 152)];

// The table's match after `matchId` (opened when that one closed), once it is there
async function nextMatch(db: Db, t: OwnTable, matchId: number) {
  await expect.poll(async () => (await db.ongoingMatch.findFirst({where: {round_id: t.roundId}}))?.id ?? null, {message: "the table's next match"}).not.toBe(matchId);
  return db.ongoingMatch.findFirstOrThrow({where: {round_id: t.roundId}});
}

// The table's finished matches, as [home, away] scores, and whether the time decided them
async function finished(db: Db, t: OwnTable) {
  const rows = await db.match.findMany({where: {round_id: t.roundId}, orderBy: {id: "asc"}});
  return rows.map((m) => ({score: t.byTeam(m.player_pair1_score, m.player_pair2_score), byTime: m.time_expired}));
}

// Meč 2 on the board: empty, the round's wins on the pips, and a fresh clock of the league's 35 minutes from the
// server's "now" that the database holds
async function expectSecondMatch(page: import("@playwright/test").Page, db: Db, t: OwnTable, previous: number, wins: [number, number]) {
  const second = await nextMatch(db, t, previous);
  await expect(page).toHaveURL(new RegExp(`/ongoing-match/${second.id}$`));
  await expect(page.getByText("Meč 2 od 2")).toBeVisible();
  await expect(page.getByText("Još nema upisanih igara")).toBeVisible();
  await expectRoundWins(page, wins);
  expect(second.ends_at!.getTime() - second.started_at!.getTime()).toBe(GAME_MINUTES * 60_000);
  expect(Math.abs(second.started_at!.getTime() - Date.now())).toBeLessThan(60_000);
  await expectTimer(page, second.ends_at!);
  return second;
}

test("the time runs out with the board open: the match closes with the score entered, the team ahead wins, and the board moves on to Meč 2; Meč 2 out of time ends the table", async ({
  as,
  api,
  db,
  table: t,
  healthy,
}) => {
  const teammate = await api(t.phone);
  await addHands(teammate, t.matchId, homeAhead(t));
  const scoreOf = (teamId: number) => db.teamScore.findUniqueOrThrow({where: {team_id_league_id: {team_id: teamId, league_id: t.leagueId}}});
  const standingsBefore = {home: await scoreOf(t.home.id), away: await scoreOf(t.away.id)};

  // the phone's clock is a fake one the test moves, so the board reaches the deadline without waiting for it
  const page = await as(t.phone);
  await page.clock.install();
  await page.goto(`/ongoing-match/${t.matchId}`);
  await expect(handRows(page)).toHaveCount(3);
  await expectTotal(page, t.home.name, 324);
  await expectTotal(page, t.away.name, 182);
  const first = await db.ongoingMatch.findUniqueOrThrow({where: {id: t.matchId}});
  await expectTimer(page, first.ends_at!);

  // the time is up on the server and, 35 minutes on, on the phone. Moving the phone's clock fires no timer (its 15 s
  // refresh stays where it was): the board's own clock has to reach the deadline and ask the server, which closes the
  // match, and the board follows it
  await moveDeadline(db, t.matchId, -1);
  await page.clock.setSystemTime(Date.now() + GAME_MINUTES * 60_000 + 1000);
  // it asks a second after its deadline (on the phone ~2 s after the jump), not only at its 5 s poll after it
  await page.waitForRequest((r) => new URL(r.url()).pathname === `/api/ongoing-matches/${t.matchId}`, {timeout: 4000});
  // Meč 2's timer counts with the server's clock (35:00 left), though the phone's clock is 35 minutes ahead
  const second = await expectSecondMatch(page, db, t, t.matchId, [1, 0]);
  expect(await finished(db, t)).toEqual([{score: [324, 182], byTime: true}]);
  const round = await db.round.findUniqueOrThrow({where: {id: t.roundId}});
  expect([round.open, ...t.byTeam(round.team1_wins, round.team2_wins)]).toEqual([true, 1, 0]);
  await healthy(page);

  // Meč 2: away ahead, 42 : 120 and 62 : 100 → 104 : 220; its time is up, and the board opened again is Kraj kola
  await addHands(teammate, second.id, [t.hand("away", 120), t.hand("away", 100)]);
  await moveDeadline(db, second.id, -1);
  await page.reload();
  await expect(page).toHaveURL(new RegExp(`/round/${t.roundId}/result$`));
  await expect(page.getByRole("heading", {name: "Kraj kola"})).toBeVisible();
  await expect(page.getByRole("main")).toContainText(new RegExp(`${escape(t.home.name)}\\s*1 pobjeda\\s*${escape(t.away.name)}\\s*1 pobjeda`));
  await expect(page.getByRole("list", {name: "Mečevi"}).getByRole("listitem")).toHaveText([/^Meč 1\s*324\s*182$/, /^Meč 2\s*104\s*220$/]);
  await healthy(page);

  // the table is closed 1 : 1, a draw, and each match counts its points as played
  expect(await finished(db, t)).toEqual([
    {score: [324, 182], byTime: true},
    {score: [104, 220], byTime: true},
  ]);
  const closed = await db.round.findUniqueOrThrow({where: {id: t.roundId}});
  expect([closed.open, closed.team1_wins, closed.team2_wins]).toEqual([false, 1, 1]);
  expect(await db.ongoingMatch.count({where: {round_id: t.roundId}})).toBe(0);
  const diff = 324 - 182 + (104 - 220);
  const after = {home: await scoreOf(t.home.id), away: await scoreOf(t.away.id)};
  const moved = (b: typeof after.home, a: typeof after.home) => [a.rounds_played - b.rounds_played, a.draws - b.draws, a.score - b.score, a.point_difference - b.point_difference];
  expect(moved(standingsBefore.home, after.home)).toEqual([1, 1, 1, diff]);
  expect(moved(standingsBefore.away, after.away)).toEqual([1, 1, 1, -diff]);
});

test("a hand saved after the time is up isn't counted: Spremi says Meč je već završen, and Na meč leads to Meč 2 (e721909)", async ({as, api, db, table: t, healthy}) => {
  await addHands(await api(t.phone), t.matchId, homeAhead(t));
  const page = await as(t.phone);
  await page.goto(`/ongoing-match/${t.matchId}`);
  await expect(handRows(page)).toHaveCount(3);

  // Igra 4 is entered in time (home calls and takes 120), and the time runs out before Spremi
  await page.getByRole("button", {name: "Upiši igru", exact: true}).click();
  await fillHand(page, {caller: t.home.name, points: {team: t.home.name, game: 120}});
  await moveDeadline(db, t.matchId, -1);
  await page.getByRole("button", {name: "Spremi", exact: true}).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Meč je već završen, pa ova igra nije spremljena.");
  await expect(page.getByRole("button", {name: "Spremi", exact: true})).toHaveCount(0);

  // the match closed with the three hands entered by the deadline; the fourth isn't anywhere
  expect(await finished(db, t)).toEqual([{score: [324, 182], byTime: true}]);
  const played = await db.match.findFirstOrThrow({where: {round_id: t.roundId}, include: {belaResults: true}});
  expect(played.belaResults).toHaveLength(3);

  await page.getByRole("button", {name: "Na meč"}).click();
  const second = await expectSecondMatch(page, db, t, t.matchId, [1, 0]);
  expect(await db.ongoingBelaResult.count({where: {match_id: second.id}})).toBe(0);
  await healthy(page);
});

test("with nobody at the scorepad, /api/cron/tick closes the match out of time and leaves the matches still in time; the board opened later is on Meč 2", async ({
  as,
  api,
  db,
  table: t,
}) => {
  // away ahead: 32 : 130, 100 : 62, then away's 95 + 50 against 67 → 199 : 337
  await addHands(await api(t.phone), t.matchId, [t.hand("away", 130), t.hand("home", 100), t.hand("away", 95, [50])]);
  // every other match in play whose time isn't up (no deadline, as the seeded ones, or one minutes away)
  const inTime = (await db.ongoingMatch.findMany({
    where: {id: {not: t.matchId}, OR: [{ends_at: null}, {ends_at: {gt: new Date(Date.now() + 5 * 60_000)}}]},
    select: {id: true},
  })).map((m) => m.id);
  expect(inTime.length).toBeGreaterThan(0);
  // the phone at the table had the board open, then was put away: no board asks for the match any more
  const board = await as(t.phone);
  await board.goto(`/ongoing-match/${t.matchId}`);
  await expect(handRows(board)).toHaveCount(3);
  await board.close();
  await moveDeadline(db, t.matchId, -60);

  const scheduler = await api("guest");
  // without the scheduler's secret nothing runs
  expect((await scheduler.get("/api/cron/tick")).status()).toBe(401);
  expect(await db.ongoingMatch.count({where: {id: t.matchId}})).toBe(1);

  expect((await tick(scheduler)).closed_tables).toContain(t.roundId);
  expect(await finished(db, t)).toEqual([{score: [199, 337], byTime: true}]);
  const round = await db.round.findUniqueOrThrow({where: {id: t.roundId}});
  expect([round.open, ...t.byTeam(round.team1_wins, round.team2_wins)]).toEqual([true, 0, 1]);
  // the matches still in time stay open; a second tick doesn't close the table's Meč 2, which has its 35 minutes
  expect(await db.ongoingMatch.count({where: {id: {in: inTime}}})).toBe(inTime.length);
  expect((await tick(scheduler)).closed_tables).not.toContain(t.roundId);
  expect(await db.ongoingMatch.count({where: {round_id: t.roundId}})).toBe(1);

  // the phone opened again on Meč 1's address is taken to Meč 2, with away's win on the right
  const page = await board.context().newPage();
  const health = watch(page);
  await page.goto(`/ongoing-match/${t.matchId}`);
  await expectSecondMatch(page, db, t, t.matchId, [0, 1]);
  await expectHealthy(page, health);
});

test("a level score when the time is up plays one more hand, and that hand ends the match", async ({as, api, db, table: t, healthy}) => {
  // 100 : 62, then away's 100 : 62 → 162 : 162
  await addHands(await api(t.phone), t.matchId, [t.hand("home", 100), t.hand("away", 100)]);
  await moveDeadline(db, t.matchId, -60);
  // neither the scheduler nor the board closes a level match
  expect((await tick(await api("guest"))).closed_tables).not.toContain(t.roundId);

  const page = await as(t.phone);
  await page.goto(`/ongoing-match/${t.matchId}`);
  await expect(handRows(page)).toHaveCount(2);
  await expectTotal(page, t.home.name, 162);
  await expectTotal(page, t.away.name, 162);
  await expect(page.getByRole("timer")).toHaveAccessibleName("Do kraja partije 0:00");
  await expect(page.getByRole("status").filter({hasText: /^Vrijeme je isteklo/})).toHaveText(
    "Vrijeme je isteklo, rezultat je izjednačen. Igrajte još jedno miješanje. Nakon upisa te igre partija završava.",
  );
  expect(await db.ongoingMatch.count({where: {id: t.matchId}})).toBe(1);

  // the extra hand: away calls with 90 + bela 20 against 72 → 72 : 110, and the match ends 234 : 272 for away
  await page.getByRole("button", {name: "Upiši igru", exact: true}).click();
  await fillHand(page, {caller: t.away.name, zvanja: {[t.away.name]: [20]}, points: {team: t.away.name, game: 90}});
  await page.getByRole("button", {name: "Spremi", exact: true}).click();
  await expectSecondMatch(page, db, t, t.matchId, [0, 1]);
  expect(await finished(db, t)).toEqual([{score: [234, 272], byTime: true}]);
  const played = await db.match.findFirstOrThrow({where: {round_id: t.roundId}, include: {belaResults: {orderBy: {result_id: "asc"}}}});
  expect(played.belaResults.map((r) => t.byTeam(r.player_pair1_total_points, r.player_pair2_total_points))).toEqual([
    [100, 62],
    [62, 100],
    [72, 110],
  ]);
  await healthy(page);
});
