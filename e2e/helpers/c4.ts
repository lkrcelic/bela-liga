// C4's own setup, Vrijeme partije: a table of tonight's league night in "E2E · Scorepad" (leagues.scorepad) that the
// test owns, for the teams of tables.timeLimit, started with a deadline (Tko igra · Započni igru gives every match the
// league's 35 minutes), and removed again afterwards, so --repeat-each never meets a table closed by the last run.
// Plus the clock's reading on the scorepad, moving a deadline in the database, and the scheduler's /api/cron/tick.
import {expect, type APIRequestContext, type Page} from "@playwright/test";
import {CRON_HEADERS, type Db} from "./db";
import {test as base} from "./fixtures";
import {publishTable, removeKolo, startMatch, type ApiHand, type Table, type Zvanje} from "./scorepad";

export type Side = {id: number; name: string; players: string[]};

export type OwnTable = Table & {
  leagueId: number;
  night: string;
  // the first match, open, with the league's 35 minutes from now
  matchId: number;
  home: Side;
  away: Side;
  // a home player's username: the phone at the table (home is on the left of its board)
  phone: string;
  homeSide: 1 | 2;
  // [home, away] from a row stored by absolute side (1 is the round's team1)
  byTeam: (one: number, two: number) => [number, number];
  // a hand where `caller` took `game` of the 162 game points (the other team the rest), with the caller's zvanja
  hand: (caller: "home" | "away", game: number, zvanja?: Zvanje[]) => ApiHand;
  // the admin's request context, for setup through the app's routes
  admin: APIRequestContext;
};

// The two teams of C4's own seeded table, tables.timeLimit (home is its team1), each with exactly two active players,
// so Tko igra has them picked already. No other section plays them; their seeded match (Kolo of tonight, no deadline)
// stays as it is, and the test's table is a new Kolo beside it.
export async function timeLimitTeams(db: Db, roundId: number): Promise<{home: Side; away: Side}> {
  const round = await db.round.findUniqueOrThrow({
    where: {id: roundId},
    include: {
      team1: {include: {teamPlayers: {include: {player: true}, orderBy: {player: {username: "asc"}}}}},
      team2: {include: {teamPlayers: {include: {player: true}, orderBy: {player: {username: "asc"}}}}},
    },
  });
  const side = (t: typeof round.team1): Side => ({id: t.team_id, name: t.team_name, players: t.teamPlayers.filter((tp) => tp.player.active).map((tp) => tp.player.username)});
  const [home, away] = [side(round.team1), side(round.team2)];
  for (const s of [home, away]) if (s.players.length !== 2) throw new Error(`${s.name} has ${s.players.length} active players, not two: reseed with e2e/local/app.sh`);
  return {home, away};
}

export const test = base.extend<{table: OwnTable}>({
  table: async ({api, db, world}, use) => {
    const {id: leagueId, tonight} = world.leagues.scorepad;
    const night = tonight!;
    const admin = await api("admin");
    const {home, away} = await timeLimitTeams(db, world.tables.timeLimit.roundId);
    const table = await publishTable(admin, db, leagueId, night, [home.id, away.id]);
    try {
      const matchId = await startMatch(admin, table.roundId);
      const homeSide: 1 | 2 = table.team1.id === home.id ? 1 : 2;
      const awaySide: 1 | 2 = homeSide === 1 ? 2 : 1;
      await use({
        ...table,
        leagueId,
        night,
        matchId,
        home,
        away,
        phone: home.players[0],
        homeSide,
        byTeam: (one, two) => (homeSide === 1 ? [one, two] : [two, one]),
        hand: (caller, game, zvanja = []) => {
          const side = caller === "home" ? homeSide : awaySide;
          return {caller: side, game1: side === 1 ? game : 162 - game, zvanja: zvanja.map((value) => ({team: side, value}))};
        },
        admin,
      });
    } finally {
      // the server recounts the standings and replays the ratings, as before the Kolo
      await removeKolo(admin, leagueId, night, table.roundNumber);
    }
  },
});

export {expect} from "./fixtures";

// Moves a match's deadline to `seconds` from now (negative: the time is up already). The phones' boards keep the
// deadline they loaded until they ask again.
export async function moveDeadline(db: Db, matchId: number, seconds: number): Promise<Date> {
  const endsAt = new Date(Date.now() + seconds * 1000);
  const {count} = await db.ongoingMatch.updateMany({where: {id: matchId}, data: {ends_at: endsAt}});
  if (count !== 1) throw new Error(`match ${matchId} is no longer open`);
  return endsAt;
}

// The scheduler's call (/api/cron/tick, every minute in production): answers with the tables whose match it closed
export async function tick(guest: APIRequestContext): Promise<{tournaments: number[]; closed_tables: number[]}> {
  const res = await guest.get("/api/cron/tick", {headers: CRON_HEADERS});
  expect(res.status(), `tick: ${await res.text()}`).toBe(200);
  return res.json();
}

// The timer in the board's head ("Do kraja partije 23:41") shows the time left until `endsAt`, the deadline the
// database holds, to within two seconds (the board counts with the server's clock, a second at a time)
export async function expectTimer(page: Page, endsAt: Date) {
  const timer = page.getByRole("timer");
  await expect
    .poll(async () => {
      if ((await timer.count()) !== 1) return "no timer on the board";
      const label = (await timer.getAttribute("aria-label")) ?? "";
      const m = label.match(/^Do kraja partije (\d+):(\d\d)$/);
      if (!m) return `the timer reads "${label}"`;
      const shown = Number(m[1]) * 60 + Number(m[2]);
      const left = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 1000));
      return Math.abs(shown - left) <= 2 ? "as the database says" : `the timer reads "${label}", the database leaves ${left} s`;
    })
    .toBe("as the database says");
}

// The timer counts down: the phone's clock (page.clock, installed before the page loaded) moves 3 s on and the timer
// reads at least 2 s less. Once it does, the board has rendered this load's clock more than once, so whatever its
// effects open (the 5-minute warning) is open by then.
export async function expectCountdown(page: Page) {
  const timer = page.getByRole("timer");
  const seconds = async () => {
    const m = ((await timer.getAttribute("aria-label")) ?? "").match(/^Do kraja partije (\d+):(\d\d)$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN;
  };
  const before = await seconds();
  expect(before, "a timer on the board").not.toBeNaN();
  await page.clock.fastForward(3000);
  await expect.poll(seconds, {message: `the timer counts down from ${before} s`}).toBeLessThanOrEqual(before - 2);
}

// The win pips of the two panels, [left, right]: the phone's own team is on the left
export async function expectRoundWins(page: Page, wins: [number, number]) {
  const pips = page.getByRole("img", {name: /^\d od 2 pobjede u kolu$/});
  await expect(pips).toHaveCount(2);
  await expect(pips.nth(0)).toHaveAccessibleName(`${wins[0]} od 2 pobjede u kolu`);
  await expect(pips.nth(1)).toHaveAccessibleName(`${wins[1]} od 2 pobjede u kolu`);
}
