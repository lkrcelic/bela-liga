// C1 · correcting a saved hand on the seeded table tables.correction (league "E2E · Scorepad", the first match in
// play with 4 hands): on a player's phone, the 1bb39ea flow (a tap on the hand opens its three steps, Spremi), and on
// the admin's phone scorepad (a tap on the hand, Ispravi korak po korak, the same steps). The fixture gives the match
// a fresh clock (it was started at seeding) and puts every hand back through the app's own route afterwards.
// Expected numbers follow the Bela rules: the caller must score more than the other team (game points + zvanja).
import {expect, test as base} from "../../helpers/fixtures";
import {correctHand, expectTotal, freshClock, handRow, handRows, putHand, savedHand} from "../../helpers/scorepad";

type Correction = {
  roundId: number;
  matchId: number;
  team1: string;
  team2: string;
  // the seeded hands, oldest first, by absolute side
  hands: {id: number; total1: number; total2: number}[];
};

const test = base.extend<{correction: Correction}>({
  correction: async ({api, db, world}, use) => {
    const table = world.tables.correction;
    const matchId = table.matchId!;
    await freshClock(db, matchId);
    const admin = await api("admin");
    const round = await db.round.findUniqueOrThrow({where: {id: table.roundId}, include: {team1: true, team2: true}});
    const rows = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}});
    const saved = await Promise.all(rows.map((r) => savedHand(admin, r.result_id)));
    await use({
      roundId: table.roundId,
      matchId,
      team1: round.team1.team_name,
      team2: round.team2.team_name,
      hands: rows.map((r) => ({id: r.result_id, total1: r.player_pair1_total_points, total2: r.player_pair2_total_points})),
    });
    for (const [i, r] of rows.entries()) await putHand(admin, r.result_id, saved[i]);
  },
});

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sum = (hands: Correction["hands"], side: "total1" | "total2") => hands.reduce((s, h) => s + h[side], 0);

test("a player corrects hand 2 through its three steps: the list, the score and the database show one corrected hand", async ({
  as,
  db,
  world,
  correction,
  healthy,
}) => {
  const {team1, team2, hands, matchId} = correction;
  expect(hands).toHaveLength(4);
  // a team1 player's phone: team1 is on the left
  const page = await as(world.tables.correction.team1[0]);
  await page.goto(`/ongoing-match/${matchId}`);
  await expect(handRows(page)).toHaveCount(4);

  // Igra 2 becomes: team1 called and took 100 of 162, nobody had zvanja → 100 : 62
  await correctHand(page, 2, {caller: team1, zvanja: {}, points: {team: team1, game: 100}});
  const left = hands[0].total1 + 100;
  const right = hands[0].total2 + 62;
  await expect(handRow(page, 2)).toHaveAccessibleName(new RegExp(`^Igra 2: 100 prema 62, ukupno ${left} prema ${right}, `));
  const total1 = sum(hands, "total1") - hands[1].total1 + 100;
  const total2 = sum(hands, "total2") - hands[1].total2 + 62;
  await expectTotal(page, team1, total1);
  await expectTotal(page, team2, total2);

  const after = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}});
  expect(after.map((r) => r.result_id)).toEqual(hands.map((h) => h.id));
  const second = after[1];
  expect([second.player_pair1_total_points, second.player_pair2_total_points, second.trump_caller_team, second.pass, second.belaPlayerAnnouncements]).toEqual([
    100,
    62,
    1,
    true,
    [],
  ]);
  const match = await db.ongoingMatch.findUniqueOrThrow({where: {id: matchId}});
  expect([match.player_pair1_score, match.player_pair2_score]).toEqual([total1, total2]);
  await healthy(page);
});

test("the admin corrects hand 2 on the phone scorepad with Ispravi korak po korak", async ({as, db, correction, healthy}) => {
  const {team1, team2, hands, matchId, roundId} = correction;
  const page = await as("admin");
  // Večer lige's "Još igraju" opens the table: Tko igra first, then its board (team1 on the left)
  await page.goto("/");
  await page.getByRole("button", {name: /^Liga: .*\. Promijeni ligu$/}).click();
  await page.getByRole("dialog", {name: "Odaberi ligu"}).getByRole("option", {name: /^E2E · Scorepad /}).click();
  await page.getByRole("region", {name: "Još igraju"}).getByRole("link", {name: new RegExp(`^Stol \\d+: ${escape(team1)} – ${escape(team2)}`)}).click();
  await expect(page.getByRole("heading", {name: /^Tko (igra|je igrao) ovu rundu\?$/})).toBeVisible();
  await page.getByRole("button", {name: /^Potvrdi/}).click();
  await expect(handRows(page)).toHaveCount(4);
  await expect(page).toHaveURL(new RegExp(`/table/${roundId}`));

  // Igra 2 becomes: team2 called with a 50 and took 70 → 70 + 50 = 120 against 92: team2 passes, 92 : 120
  await correctHand(page, 2, {caller: team2, zvanja: {[team2]: [50]}, points: {team: team2, game: 70}});
  await expect(handRow(page, 2)).toHaveAccessibleName(new RegExp(`^Igra 2: 92 prema 120, ukupno ${hands[0].total1 + 92} prema ${hands[0].total2 + 120}, `));
  const total1 = sum(hands, "total1") - hands[1].total1 + 92;
  const total2 = sum(hands, "total2") - hands[1].total2 + 120;
  await expectTotal(page, team1, total1);
  await expectTotal(page, team2, total2);

  const after = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}});
  expect(after.map((r) => r.result_id)).toEqual(hands.map((h) => h.id));
  const second = after[1];
  expect([second.player_pair1_total_points, second.player_pair2_total_points, second.trump_caller_team, second.pass]).toEqual([92, 120, 2, true]);
  expect(second.belaPlayerAnnouncements.map((a) => [a.team, a.announcement_type])).toEqual([[2, "FIFTY"]]);
  const match = await db.ongoingMatch.findUniqueOrThrow({where: {id: matchId}});
  expect([match.player_pair1_score, match.player_pair2_score]).toEqual([total1, total2]);
  await healthy(page);
});
