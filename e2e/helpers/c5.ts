// C5's own helpers: the admin correcting a finished match on the table's scorepad (the phone's and the computer's),
// what a finished match and the standings and ratings around it hold, and putting a hand back through the app's routes.
import type {Prisma} from "@prisma/client";
import {expect, type APIRequestContext, type Page} from "@playwright/test";
import {ONBOARDED, type Db} from "./db";
import {handRow, type Hand, type Zvanje} from "./scorepad";

export const THRESHOLD = 1001;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const VALUE = {TWENTY: 20, FIFTY: 50, ONE_HUNDRED: 100, ONE_HUNDRED_FIFTY: 150, TWO_HUNDRED: 200} as const;

const handInclude = {belaPlayerAnnouncements: {orderBy: {announcement_id: "asc"}}} as const;
export type StoredHand = Prisma.BelaResultGetPayload<{include: typeof handInclude}>;
export type FinishedMatch = Prisma.MatchGetPayload<{include: {belaResults: {include: typeof handInclude}}}>;

// ---------- reading the database ----------

// The table's finished matches with their hands, Meč 1 first
export function finishedMatches(db: Db, roundId: number): Promise<FinishedMatch[]> {
  return db.match.findMany({
    where: {round_id: roundId},
    orderBy: {id: "asc"},
    include: {belaResults: {orderBy: {result_id: "asc"}, include: handInclude}},
  });
}

// The winner of a match closed with Završi meč: the team over 1001 with more points (1 or 2), or none
export function winnerOf(score1: number, score2: number): 1 | 2 | null {
  if (Math.max(score1, score2) < THRESHOLD || score1 === score2) return null;
  return score1 > score2 ? 1 : 2;
}

// The hand that decided a finished match, its last: without it nobody has 1001, which is what the admin's correction
// in these tests does to the match. Fails when the generated match isn't like that (a scenario for the generator).
export function decidingHand(match: FinishedMatch): {hand: StoredHand; without: [number, number]} {
  const hand = match.belaResults[match.belaResults.length - 1];
  const without: [number, number] = [match.player_pair1_score - hand.player_pair1_total_points, match.player_pair2_score - hand.player_pair2_total_points];
  expect(winnerOf(match.player_pair1_score, match.player_pair2_score), `match ${match.id} should have a winner`).not.toBeNull();
  expect(winnerOf(...without), `match ${match.id} without its last hand should have no winner`).toBeNull();
  return {hand, without};
}

// A hand as the tests compare them: totals, caller, Štiglja and zvanja by side
export const handShape = (h: StoredHand | Prisma.OngoingBelaResultGetPayload<{include: typeof handInclude}>) => ({
  totals: [h.player_pair1_total_points, h.player_pair2_total_points],
  game: [h.player_pair1_game_points, h.player_pair2_game_points],
  caller: h.trump_caller_team,
  pass: h.pass,
  stiglja: h.complete_victory,
  zvanja: h.belaPlayerAnnouncements.map((a) => `${a.team} ${a.announcement_type}`).sort(),
});

export type Standing = {rounds_played: number; wins: number; draws: number; losses: number; score: number; point_difference: number};

// The league's season rows of these teams (Ukupni poredak), by team id
export async function standings(db: Db, leagueId: number, teamIds: number[]): Promise<Record<number, Standing>> {
  const rows = await db.teamScore.findMany({where: {league_id: leagueId, team_id: {in: teamIds}}});
  const out: Record<number, Standing> = {};
  for (const r of rows) {
    out[r.team_id] = {rounds_played: r.rounds_played, wins: r.wins, draws: r.draws, losses: r.losses, score: r.score, point_difference: r.point_difference};
  }
  return out;
}

// How a row moved: after minus before, field by field
export const moved = (before: Standing, after: Standing): Standing => ({
  rounds_played: after.rounds_played - before.rounds_played,
  wins: after.wins - before.wins,
  draws: after.draws - before.draws,
  losses: after.losses - before.losses,
  score: after.score - before.score,
  point_difference: after.point_difference - before.point_difference,
});

export type Rating = {rating: number; history: {night: string; rating: number; change: number; rounds: number}[]};

// The players' ratings and their per-night history (the Rejting page), by player id
export async function ratings(db: Db, playerIds: number[]): Promise<Record<number, Rating>> {
  const players = await db.player.findMany({where: {id: {in: playerIds}}, select: {id: true, rating: true}});
  const history = await db.playerRatingHistory.findMany({where: {player_id: {in: playerIds}}, orderBy: [{player_id: "asc"}, {night: "asc"}]});
  const out: Record<number, Rating> = {};
  for (const p of players) {
    out[p.id] = {
      rating: p.rating,
      history: history
        .filter((h) => h.player_id === p.id)
        .map((h) => ({night: h.night.toISOString().slice(0, 10), rating: h.rating, change: h.change, rounds: h.rounds})),
    };
  }
  return out;
}

// The table's lineup (Tko igra) by team, and a player of `teamId` who opens Početna without an onboarding sheet
export async function lineup(db: Db, roundId: number, teamId: number) {
  const players = await db.roundPlayer.findMany({where: {round_id: roundId}, include: {player: true}, orderBy: {player: {username: "asc"}}});
  const ready = await db.player.findMany({where: {...ONBOARDED, id: {in: players.map((p) => p.player_id)}}, select: {id: true}});
  const phone = players.find((p) => p.team_id === teamId && ready.some((r) => r.id === p.player_id));
  if (!phone) throw new Error(`table ${roundId}: no onboarded player of team ${teamId} in its lineup`);
  return {playerIds: players.map((p) => p.player_id), phone: phone.player.username, phoneId: phone.player_id};
}

// ---------- the admin's phone scorepad ----------

// A table's scorepad as the admin opens it: Tko igra (or Tko je igrao) first every time, Potvrdi, then the board
export async function openTable(page: Page, path: string) {
  await page.goto(path);
  await confirmLineup(page);
}

export async function confirmLineup(page: Page) {
  await expect(page.getByRole("heading", {name: /^Tko (igra|je igrao) ovu rundu\?$/})).toBeVisible();
  await page.getByRole("button", {name: /^Potvrdi/}).click();
  await expect(page.getByRole("button", {name: /^Natrag na kolo \d+$/})).toBeVisible();
}

// Meč n in Meč 1 · Meč 2 (the tabs are there once a match is finished)
export async function pickMatch(page: Page, n: number) {
  const tab = page.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: new RegExp(`^Meč ${n} `)});
  await tab.click();
  await expect(tab).toBeChecked();
}

// Hand n of the board, by its accessible name ("Igra 9: 37 prema 195, ukupno 528 prema 978, …"): the board shows
// team1 on the left on the admin's scorepad
export async function expectHand(page: Page, n: number, hand: StoredHand, total: [number, number]) {
  await expect(handRow(page, n)).toHaveAccessibleName(
    new RegExp(`^Igra ${n}: ${hand.player_pair1_total_points} prema ${hand.player_pair2_total_points}, ukupno ${total[0]} prema ${total[1]}, `),
  );
}

// A tap on hand n, Obriši igru in its sheet, and Obriši igru again in "Obriši igru n?". What comes next is the
// caller's: the board recounted, or "Meč ostaje bez pobjednika?"
export async function deleteHand(page: Page, n: number) {
  await expect(handRow(page, n)).toBeVisible();
  await handRow(page, n).click();
  await page.getByRole("dialog", {name: `Igra ${n}`}).getByRole("button", {name: "Obriši igru"}).click();
  const confirm = page.getByRole("dialog", {name: `Obriši igru ${n}?`});
  await expect(confirm).toContainText(/briše se iz Meča \d\. Zbroj meča i poredak ponovno se računaju\./);
  await confirm.getByRole("button", {name: "Obriši igru"}).click();
}

// "Meč ostaje bez pobjednika?" when the match can't go back in play: the score it would have, and why
export function noWinnerSheet(page: Page) {
  return page.getByRole("dialog", {name: "Meč ostaje bez pobjednika?"});
}

export const cantReopen = (without: [number, number], why: string) =>
  `Nakon ove promjene meč je ${without[0]}:${without[1]} i nitko nema ${THRESHOLD}. ${why}, pa se ne može ponovno otvoriti igračima: ostaje bez pobjednika dok ne dopišeš igre koje su odigrane. Rezultat stola, poredak i rejting ponovno se računaju.`;

// ---------- the admin's scorepad on the computer ----------

// A new hand in the computer's entry panel (Igra n): Tko je zvao, each team's zvanja, the game points, Spremi igru
export async function enterHandOnComputer(page: Page, hand: Hand) {
  const panel = page.getByRole("region", {name: /^Igra \d+$/});
  await expect(panel).toBeVisible();
  const caller = panel.getByRole("radiogroup", {name: "Tko je zvao"}).getByRole("radio", {name: hand.caller, exact: true});
  await caller.click();
  await expect(caller).toBeChecked();
  const box = (team: string) => panel.getByRole("radiogroup", {name: "Upis za ekipu"}).getByRole("radio", {name: new RegExp(`^${escape(team)}: zvanja `)});
  for (const [team, list] of Object.entries(hand.zvanja ?? {})) {
    await box(team).click();
    await expect(box(team)).toBeChecked();
    for (const z of list) await panel.getByRole("button", {name: new RegExp(`^Zvanje ${z}(,|$)`)}).click();
    await expect(box(team)).toHaveAccessibleName(new RegExp(`^${escape(team)}: zvanja ${list.reduce((s, z) => s + z, 0)}, `));
  }
  const points = hand.points;
  const team = "stiglja" in points ? points.stiglja : points.team;
  await box(team).click();
  await expect(box(team)).toBeChecked();
  const keypad = panel.getByRole("group", {name: "Bodovi"});
  if ("stiglja" in points) await keypad.getByRole("button", {name: "Štiglja"}).click();
  else for (const d of String(points.game)) await keypad.getByRole("button", {name: d, exact: true}).click();
  await expect(box(team)).toHaveAccessibleName(new RegExp(`, igra ${"stiglja" in points ? 252 : points.game}$`));
  await panel.getByRole("button", {name: "Spremi igru"}).click();
}

// ---------- a stored hand entered again ----------

// As the players' (or the admin's) three steps enter it, the teams by name ([team1, team2])
export function asHand(h: StoredHand, names: [string, string]): Hand {
  const zvanja: Record<string, Zvanje[]> = {[names[0]]: [], [names[1]]: []};
  for (const a of h.belaPlayerAnnouncements) zvanja[names[a.team - 1]].push(VALUE[a.announcement_type]);
  const points: Hand["points"] = h.complete_victory
    ? {stiglja: names[h.player_pair1_game_points > 0 ? 0 : 1]}
    : {team: names[0], game: h.player_pair1_game_points};
  return {caller: names[(h.trump_caller_team ?? 1) - 1], points, zvanja};
}

// As the admin's scorepad sends it (the server recomputes the totals)
function asAdminHand(h: StoredHand) {
  return {
    manual: false,
    player_pair1_game_points: h.player_pair1_game_points,
    player_pair2_game_points: h.player_pair2_game_points,
    player_pair1_announcement_points: h.player_pair1_announcement_points,
    player_pair2_announcement_points: h.player_pair2_announcement_points,
    player_pair1_total_points: h.player_pair1_total_points,
    player_pair2_total_points: h.player_pair2_total_points,
    trump_caller_team: h.trump_caller_team,
    pass: h.pass,
    complete_victory: h.complete_victory,
    announcements: h.belaPlayerAnnouncements.map((a) => ({team: a.team, announcement_type: a.announcement_type})),
  };
}

// The admin adds a hand to a finished match ("finished") or to the match being played at the table ("ongoing"),
// through the scorepad's own route
export async function adminAddHand(admin: APIRequestContext, roundId: number, target: {kind: "ongoing"} | {kind: "finished"; matchId: number}, hand: StoredHand) {
  const res = await admin.post(`/api/admin/tables/${roundId}/hands`, {data: {target, hand: asAdminHand(hand)}});
  expect(res.ok(), `add hand to table ${roundId}: ${await res.text()}`).toBeTruthy();
}

// The admin deletes a finished match's hand, past "Meč ostaje bez pobjednika?" (Obriši svejedno)
export async function adminDeleteFinishedHand(admin: APIRequestContext, resultId: number) {
  const res = await admin.delete(`/api/admin/hands/finished/${resultId}?allow_no_winner=1`);
  expect(res.ok(), `delete hand ${resultId}: ${await res.text()}`).toBeTruthy();
}

// Završi meč at the table, as the admin's scorepad does it
export async function adminFinishMatch(admin: APIRequestContext, roundId: number) {
  const res = await admin.post(`/api/admin/tables/${roundId}/finish`);
  expect(res.ok(), `finish the match at table ${roundId}: ${await res.text()}`).toBeTruthy();
}

// Puts the deciding hand back into Meč `index` of a finished table when a test (or a failed run) left it out: into the
// finished match while it is still finished, or into the match back in play, which is then finished again. The hand is
// recognised by its place: the match held `count` hands with it.
export async function putBackDecidingHand(admin: APIRequestContext, db: Db, roundId: number, matchIndex: number, hand: StoredHand, count: number) {
  const ongoing = await db.ongoingMatch.findFirst({where: {round_id: roundId}, include: {_count: {select: {belaResults: true}}}});
  const finished = await finishedMatches(db, roundId);
  if (finished.length > matchIndex) {
    if (finished[matchIndex].belaResults.length < count) await adminAddHand(admin, roundId, {kind: "finished", matchId: finished[matchIndex].id}, hand);
    return;
  }
  if (!ongoing) return;
  if (ongoing._count.belaResults < count) await adminAddHand(admin, roundId, {kind: "ongoing"}, hand);
  await adminFinishMatch(admin, roundId);
}
