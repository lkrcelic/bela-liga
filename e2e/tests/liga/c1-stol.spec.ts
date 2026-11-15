// C1 · players at a table of tonight's Kolo, on the phone: Tko igra and the scorepad (Upiši igru through Izaberi tko
// je zvao, Zvanja, Igra, Spremi), correcting a saved hand (1bb39ea), Završi meč with a second quick tap (#74), Meč 2,
// Kraj kola, then Dnevni poredak, Ukupni poredak and the players' ratings.
// Each test publishes its own one-table Kolo in "E2E · Novo kolo" the way the admin does (Novo kolo, Odobri sva,
// Objavi); the `night` fixture removes tonight's rounds afterwards, and the server recounts standings and ratings.
// Expected numbers follow the Bela rules (src/app/_lib/bela/scoring.ts): a hand is 162 game points; the caller must
// score more than the other team (game points + zvanja), otherwise it is pad and the other team takes 162 and every
// zvanje; Štiglja is 252 : 0 plus every zvanje; a match is won at 1001.
import type {APIRequestContext, Page} from "@playwright/test";
import {expect, pickTeams, test, type Side} from "../../helpers/c1";
import {addHands, correctHand, enterHand, expectTotal, finishMatch, handRow, handRows, publishTable, startMatch, type ApiHand, type Table} from "../../helpers/scorepad";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// the standings' signed numbers: "+612", "−5" (a real minus), "0"
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

// The table seen from the home team's side: the phone is a home player's, so home is on the left of the board
function sides(table: Table, home: Side) {
  const homeSide: 1 | 2 = table.team1.id === home.id ? 1 : 2;
  const awaySide: 1 | 2 = homeSide === 1 ? 2 : 1;
  return {
    homeSide,
    awaySide,
    // [home, away] from a row stored by absolute side
    byTeam: (one: number, two: number): [number, number] => (homeSide === 1 ? [one, two] : [two, one]),
    // a hand where `caller` took `game` of the 162 points (the other team the rest), no zvanja
    hand: (caller: "home" | "away", game: number): ApiHand => {
      const side = caller === "home" ? homeSide : awaySide;
      return {caller: side, game1: side === 1 ? game : 162 - game};
    },
  };
}

test("Tko igra starts the table, and the hands entered on the scorepad are listed with their totals", async ({as, db, night, healthy}) => {
  const {home, away, phone} = await pickTeams(db, night.league.id);
  const table = await publishTable(night.admin, db, night.league.id, night.night, [home.id, away.id]);
  const {byTeam, homeSide} = sides(table, home);

  // Početna → Započni igru
  const page = await as(phone);
  await page.goto("/");
  await page.getByRole("button", {name: new RegExp(`^STOL 1 .*${escape(home.name)}.*Započni igru$`)}).click();

  // Tko igra: two players per team (both teams have exactly two, so they are already picked)
  await expect(page.getByRole("heading", {name: "Tko igra ovu rundu?"})).toBeVisible();
  for (const team of [home, away]) {
    const slots = page.getByRole("region", {name: team.name, exact: true}).getByRole("button");
    await expect(slots).toHaveCount(2);
    for (const p of team.players) await expect(slots.filter({hasText: `@${p.username}`})).toHaveCount(1);
  }
  await page.getByRole("button", {name: "Potvrdi i počni"}).click();

  // the scoreboard of the first match, empty
  await expect(page).toHaveURL(/\/ongoing-match\/\d+$/);
  await expect(page.getByText("Meč 1 od 2")).toBeVisible();
  await expect(page.getByText("Još nema upisanih igara")).toBeVisible();
  const lineup = await db.roundPlayer.findMany({where: {round_id: table.roundId}});
  expect(lineup.map((p) => p.player_id).sort()).toEqual([...home.players, ...away.players].map((p) => p.id).sort());

  // Igra 1: home calls with 90 + 20 = 110 against 72 + 50 = 122: pad, away takes 162 + 70
  await enterHand(page, {caller: home.name, zvanja: {[home.name]: [20], [away.name]: [50]}, points: {team: home.name, game: 90}});
  await expect(handRow(page, 1)).toHaveAccessibleName(/^Igra 1: 0 prema 232, ukupno 0 prema 232, razlika 232/);
  // Igra 2: Štiglja for home with its bela: 252 + 20 : 0
  await enterHand(page, {caller: home.name, zvanja: {[home.name]: [20]}, points: {stiglja: home.name}});
  await expect(handRow(page, 2)).toHaveAccessibleName(/^Igra 2: 272 prema 0, ukupno 272 prema 232, razlika 40/);
  await expectTotal(page, home.name, 272);
  await expectTotal(page, away.name, 232);

  // the database holds the same two hands, by the round's sides
  const match = await db.ongoingMatch.findFirstOrThrow({
    where: {round_id: table.roundId},
    include: {belaResults: {orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}}},
  });
  expect(byTeam(match.player_pair1_score, match.player_pair2_score)).toEqual([272, 232]);
  expect(
    match.belaResults.map((r) => ({
      totals: byTeam(r.player_pair1_total_points, r.player_pair2_total_points),
      caller: r.trump_caller_team,
      pass: r.pass,
      stiglja: r.complete_victory,
      zvanja: r.belaPlayerAnnouncements.map((a) => `${a.team === homeSide ? "home" : "away"} ${a.announcement_type}`).sort(),
    })),
  ).toEqual([
    {totals: [0, 232], caller: homeSide, pass: false, stiglja: false, zvanja: ["away FIFTY", "home TWENTY"]},
    {totals: [272, 0], caller: homeSide, pass: true, stiglja: true, zvanja: ["home TWENTY"]},
  ]);
  await healthy(page);
});

test("a saved hand corrected on the phone is still one hand, with the new points in the list, the score and the database (1bb39ea)", async ({
  as,
  api,
  db,
  night,
  healthy,
}) => {
  const {home, away, phone} = await pickTeams(db, night.league.id);
  const table = await publishTable(night.admin, db, night.league.id, night.night, [home.id, away.id]);
  const {byTeam, hand, awaySide} = sides(table, home);
  const matchId = await startMatch(night.admin, table.roundId);
  // three hands from a teammate's phone: 100 : 62, then away's 90 + bela 20 against 72, then away's Štiglja 0 : 252
  await addHands(await api(phone), matchId, [
    hand("home", 100),
    {...hand("away", 90), zvanja: [{team: awaySide, value: 20}]},
    {caller: awaySide, stiglja: awaySide},
  ]);
  const before = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}});
  expect(before.map((r) => byTeam(r.player_pair1_total_points, r.player_pair2_total_points))).toEqual([
    [100, 62],
    [72, 110],
    [0, 252],
  ]);

  const page = await as(phone);
  await page.goto(`/ongoing-match/${matchId}`);
  await expect(handRows(page)).toHaveCount(3);
  // Igra 2 again: away had only 50, so 50 + 20 = 70 against 112 is pad: home takes 162 + 20
  await correctHand(page, 2, {points: {team: away.name, game: 50}});
  await expect(handRow(page, 2)).toHaveAccessibleName(/^Igra 2: 182 prema 0, ukupno 282 prema 62, razlika 220/);
  await expect(handRow(page, 3)).toHaveAccessibleName(/^Igra 3: 0 prema 252, ukupno 282 prema 314, razlika 32/);
  await expectTotal(page, home.name, 282);
  await expectTotal(page, away.name, 314);

  // one hand changed in place: the same three rows, the second with the new points, and the score moved with it
  const after = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}});
  expect(after.map((r) => r.result_id)).toEqual(before.map((r) => r.result_id));
  expect(after.map((r) => byTeam(r.player_pair1_total_points, r.player_pair2_total_points))).toEqual([
    [100, 62],
    [182, 0],
    [0, 252],
  ]);
  expect([after[1].trump_caller_team, after[1].pass, after[1].belaPlayerAnnouncements.map((a) => a.team)]).toEqual([awaySide, false, [awaySide]]);
  const match = await db.ongoingMatch.findUniqueOrThrow({where: {id: matchId}});
  expect(byTeam(match.player_pair1_score, match.player_pair2_score)).toEqual([282, 314]);
  await healthy(page);
});

// Both matches end the same way: six hands of 152 : 10 from a teammate's phone (912 : 60), then the phone's own hand
// of 102 : 60 takes home to 1014 : 120. The board is opened afresh rather than waiting for its 15 s refresh.
async function playToTheLastHand(page: Page, matchId: number, home: Side, hands: ApiHand[], teammate: APIRequestContext) {
  await addHands(teammate, matchId, hands);
  await page.goto(`/ongoing-match/${matchId}`);
  await expect(handRows(page)).toHaveCount(6);
  await expectTotal(page, home.name, 912);
  await enterHand(page, {caller: home.name, points: {team: home.name, game: 102}});
  await expectTotal(page, home.name, 1014);
  await expect(page.getByRole("button", {name: "Završi meč"})).toBeVisible();
}

test("Završi meč tapped twice opens Meč 2 and no new hand (#74); Meč 2 ends the Kolo, and the standings and ratings follow", async ({
  as,
  api,
  db,
  night,
  healthy,
}) => {
  const {home, away, phone} = await pickTeams(db, night.league.id);
  const table = await publishTable(night.admin, db, night.league.id, night.night, [home.id, away.id]);
  const {byTeam, hand, homeSide} = sides(table, home);
  const firstMatch = await startMatch(night.admin, table.roundId);
  const teammate = await api(phone);
  const sixHands = Array.from({length: 6}, () => hand("home", 152));
  const scoreOf = (teamId: number) => db.teamScore.findUniqueOrThrow({where: {team_id_league_id: {team_id: teamId, league_id: night.league.id}}});
  const standingsBefore = {home: await scoreOf(home.id), away: await scoreOf(away.id)};
  const players = [...home.players, ...away.players];
  const ratingsBefore = new Map((await db.player.findMany({where: {id: {in: players.map((p) => p.id)}}})).map((p) => [p.id, p.rating]));

  const page = await as(phone);
  await playToTheLastHand(page, firstMatch, home, sixHands, teammate);

  // #74: a second tap on the same spot while the next match opens. The window is held open: on a phone without view
  // transitions (Reduce Motion, older Safari) the board stays tappable while the next page loads, so the test holds
  // that page back and taps again once the board has asked for it. #74's board had emptied the finished match by
  // then and showed Upiši igru under the finger, for the closed match; the fixed board keeps Završi meč (loading).
  await page.emulateMedia({reducedMotion: "reduce"});
  const visited: string[] = [];
  page.on("framenavigated", (frame) => frame === page.mainFrame() && visited.push(new URL(frame.url()).pathname));
  let asked!: () => void;
  let release!: () => void;
  const nextPageAsked = new Promise<void>((resolve) => (asked = resolve));
  const nextPageHeld = new Promise<void>((resolve) => (release = resolve));
  const nextPage = /\/ongoing-match\/\d+(\?.*)?$/;
  await page.route(nextPage, async (route) => {
    // the client navigation's request for the next board (its RSC payload): not a prefetch, not this match's own board
    const request = route.request();
    const headers = request.headers();
    if (headers["rsc"] && !headers["next-router-prefetch"] && new URL(request.url()).pathname !== `/ongoing-match/${firstMatch}`) {
      asked();
      await nextPageHeld;
    }
    await route.continue();
  });
  const finishButton = page.getByRole("button", {name: "Završi meč"});
  // a trial tap waits until the board takes taps (the way back from the hand's steps has settled)
  await finishButton.tap({trial: true});
  const box = (await finishButton.boundingBox())!;
  const spot = {x: box.x + box.width / 2, y: box.y + box.height / 2};
  await page.touchscreen.tap(spot.x, spot.y);
  await nextPageAsked;
  await page.touchscreen.tap(spot.x, spot.y);
  release();
  await expect.poll(() => db.match.count({where: {round_id: table.roundId}})).toBe(1);
  const secondMatch = (await db.ongoingMatch.findFirstOrThrow({where: {round_id: table.roundId}})).id;
  await expect(page).toHaveURL(new RegExp(`/ongoing-match/${secondMatch}$`));
  await expect(page.getByText("Meč 2 od 2")).toBeVisible();
  await expect(page.getByText("Još nema upisanih igara")).toBeVisible();
  await expect(page.getByRole("img", {name: "1 od 2 pobjede u kolu"})).toHaveCount(1);
  expect(visited.filter((path) => path.includes("/ongoing-result/"))).toEqual([]);
  const firstDone = await db.match.findMany({where: {round_id: table.roundId}});
  expect(firstDone.map((m) => byTeam(m.player_pair1_score, m.player_pair2_score))).toEqual([[1014, 120]]);
  expect(await db.ongoingBelaResult.count({where: {match_id: secondMatch}})).toBe(0);
  await page.unroute(nextPage);
  await page.emulateMedia({reducedMotion: "no-preference"});

  // Meč 2 the same way, then Završi meč: Kraj kola
  await playToTheLastHand(page, secondMatch, home, sixHands, teammate);
  expect(await finishMatch(page)).toBe("end");
  await expect(page).toHaveURL(new RegExp(`/round/${table.roundId}/result$`));
  await expect(page.getByRole("heading", {name: "Kraj kola"})).toBeVisible();
  await expect(page.getByRole("main")).toContainText(new RegExp(`${escape(home.name)}\\s*2 pobjede\\s*${escape(away.name)}\\s*0 pobjeda`));
  await expect(page.getByRole("list", {name: "Mečevi"}).getByRole("listitem")).toHaveText([/^Meč 1\s*1014\s*120$/, /^Meč 2\s*1014\s*120$/]);
  await healthy(page);

  // the table is closed 2 : 0 for home, by 2 × 894 points
  const closed = await db.round.findUniqueOrThrow({where: {id: table.roundId}});
  expect([closed.open, ...byTeam(closed.team1_wins, closed.team2_wins)]).toEqual([false, 2, 0]);
  const diff = 2 * (1014 - 120);
  const after = {home: await scoreOf(home.id), away: await scoreOf(away.id)};
  const moved = (b: typeof after.home, a: typeof after.home) => ({
    rounds_played: a.rounds_played - b.rounds_played,
    wins: a.wins - b.wins,
    draws: a.draws - b.draws,
    losses: a.losses - b.losses,
    score: a.score - b.score,
    point_difference: a.point_difference - b.point_difference,
  });
  expect(moved(standingsBefore.home, after.home)).toEqual({rounds_played: 1, wins: 1, draws: 0, losses: 0, score: 2, point_difference: diff});
  expect(moved(standingsBefore.away, after.away)).toEqual({rounds_played: 1, wins: 0, draws: 0, losses: 1, score: 0, point_difference: -diff});

  // the winners' ratings went up and the losers' down
  const ratingsAfter = new Map((await db.player.findMany({where: {id: {in: players.map((p) => p.id)}}})).map((p) => [p.id, p.rating]));
  for (const p of home.players) expect(ratingsAfter.get(p.id)!, `${p.username} won`).toBeGreaterThan(ratingsBefore.get(p.id)!);
  for (const p of away.players) expect(ratingsAfter.get(p.id)!, `${p.username} lost`).toBeLessThan(ratingsBefore.get(p.id)!);
  await page.goto("/");
  const me = home.players.find((p) => p.username === phone)!;
  await expect(page.getByRole("link", {name: `Rejting ${ratingsAfter.get(me.id)}`})).toBeVisible();

  // Dnevni poredak: tonight's table of the two teams, and the Kolo's table finished
  await page.goto(`/league/${night.league.id}/daily-standings`);
  // only the two teams played tonight: home first with the win and its 2 points, away second
  const gathering = page.getByRole("tabpanel", {name: "Tablica okupljanja"}).getByRole("listitem");
  await expect(gathering).toHaveText([
    new RegExp(`^1.*${escape(home.name)}\\s*1 POB · 0 NER · 0 IZG\\s*2\\s*${escape(signed(diff))}$`),
    new RegExp(`^2.*${escape(away.name)}\\s*0 POB · 0 NER · 1 IZG\\s*0\\s*${escape(signed(-diff))}$`),
  ]);
  await page.getByRole("tab", {name: `Kolo ${table.roundNumber}`}).click();
  const [w1, w2] = homeSide === 1 ? [2, 0] : [0, 2];
  const [d1, d2] = homeSide === 1 ? [diff, -diff] : [-diff, diff];
  await expect(page.getByRole("link", {name: /^Stol 1: /})).toHaveAccessibleName(
    `Stol 1: ${table.team1.name} ${w1}, ${table.team2.name} ${w2}, završeno, razlika ${signed(d1)} : ${signed(d2)}. Otvori stol`,
  );

  // Ukupni poredak: both teams' season rows moved by the table
  await page.goto(`/league/${night.league.id}/standings`);
  await expect(page.getByRole("heading", {name: "Ukupni poredak"})).toBeVisible();
  const season = (team: string, s: typeof after.home) =>
    expect(page.getByRole("listitem").filter({has: page.getByRole("link", {name: team, exact: true})})).toContainText(
      new RegExp(`${s.rounds_played} OK · ${s.wins} POB · ${s.draws} NER · ${s.losses} IZG\\s*${s.score}\\s*${escape(signed(s.point_difference))}`),
    );
  await season(home.name, after.home);
  await season(away.name, after.away);
  await healthy(page);
});
