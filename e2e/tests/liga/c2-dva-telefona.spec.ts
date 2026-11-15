// C2 · two phones of one team at the same table (tables.twoPhones: league "E2E · Scorepad", the first match in play
// with 2 hands), each in its own browser context on the match's board.
// The same hand entered on both (#57, 3efe0f4, DECISIONS #91): the phone that saves second is asked "Je li ovo nova
// igra?" with the hand the other phone saved; Odustani (or ✕) drops its copy, so the match holds the hand once, and its
// board shows the other phone's hand and goes on; Upiši i ovu saves the same hand again on purpose. A correction of a
// saved hand never asks (it doesn't add a hand), on either side of a new hand from the other phone.
// Expected numbers follow the Bela rules (src/app/_lib/bela/scoring.ts): a hand is 162 game points; the caller must
// score more than the other team (game points + zvanja), otherwise it is pad and the other team takes 162 and every
// zvanje. Both phones are team1's, so team1 is on the left of both boards.
import type {Page} from "@playwright/test";
import type {Db} from "../../helpers/db";
import {expect, openNewHand, sameHandQuestion, test, type TwoPhones} from "../../helpers/c2";
import {correctHand, enterHand, expectTotal, fillHand, handRow, handRows, openHand, saveHand, type Hand} from "../../helpers/scorepad";

// hand n's row on a team1 board: "Igra n: <team1> prema <team2>, ukupno <team1> prema <team2>, razlika …"
const row = (n: number, hand: [number, number], total: [number, number]) =>
  new RegExp(`^Igra ${n}: ${hand[0]} prema ${hand[1]}, ukupno ${total[0]} prema ${total[1]}, `);

// the seeded score, team1 first
const seededScore = (t: TwoPhones): [number, number] => [t.seeded.reduce((s, h) => s + h.total1, 0), t.seeded.reduce((s, h) => s + h.total2, 0)];
const plus = (a: [number, number], ...hands: [number, number][]): [number, number] => hands.reduce(([x, y], [p, q]) => [x + p, y + q], a);

// the match as the database holds it: every hand's totals, oldest first, and the score (team1 first)
async function stored(db: Db, matchId: number) {
  const hands = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}});
  const match = await db.ongoingMatch.findUniqueOrThrow({where: {id: matchId}});
  return {
    ids: hands.map((h) => h.result_id),
    hands: hands.map((h) => [h.player_pair1_total_points, h.player_pair2_total_points]),
    rows: hands,
    score: [match.player_pair1_score, match.player_pair2_score],
  };
}

// Spremi on the last step where the server holds the save back: the question opens over the step
async function saveAndExpectQuestion(page: Page) {
  await page.getByRole("button", {name: "Spremi", exact: true}).click();
  const question = sameHandQuestion(page);
  await expect(question).toBeVisible();
  return question;
}

test("the same hand from both phones: the second is asked Je li ovo nova igra?, Odustani keeps it once, and that board shows the first phone's hand and goes on (#57)", async ({
  twoPhones,
  db,
  healthy,
}) => {
  const {matchId, team1, team2, seeded, phones} = twoPhones;
  const [first, second] = phones;
  const start = seededScore(twoPhones);
  // the first phone's board is left to refresh by itself (every 15 s): its timers run on a clock the test moves
  await first.clock.install();
  await first.reload();
  await expect(handRows(first)).toHaveCount(2);

  // both phones open Upiši igru on the board with 2 hands; the first saves: team1 called and took 100 of 162 → 100 : 62
  const hand: Hand = {caller: team1, points: {team: team1, game: 100}};
  await openNewHand(second);
  await enterHand(first, hand);
  const afterFirst = plus(start, [100, 62]);
  await expect(handRow(first, 3)).toHaveAccessibleName(row(3, [100, 62], afterFirst));

  // the second phone enters the same hand: Spremi asks, naming the hand the first phone saved
  await fillHand(second, hand);
  const question = await saveAndExpectQuestion(second);
  await expect(question).toContainText("S drugog mobitela je upisana igra 3 (100 : 62). Ako je to ova ista igra, odustani.");
  await expect(question.getByRole("button", {name: "Upiši i ovu"})).toBeVisible();
  // held back: the match has the hand once
  expect(await db.ongoingBelaResult.count({where: {match_id: matchId}})).toBe(3);

  // Odustani: the copy is dropped and the board shows the first phone's hand
  await question.getByRole("button", {name: "Odustani"}).click();
  await expect(question).toBeHidden();
  await expect(second).toHaveURL(new RegExp(`/ongoing-match/${matchId}$`));
  await expect(handRows(second)).toHaveCount(3);
  await expect(handRow(second, 3)).toHaveAccessibleName(row(3, [100, 62], afterFirst));
  await expectTotal(second, team1, afterFirst[0]);
  await expectTotal(second, team2, afterFirst[1]);
  let match = await stored(db, matchId);
  expect(match.ids.slice(0, 2)).toEqual(seeded.map((h) => h.id));
  expect(match.hands.slice(2)).toEqual([[100, 62]]);
  expect(match.score).toEqual(afterFirst);

  // and goes on: its next hand saves without a question. team2 called with a 50 and took 90 → 72 : 90 + 50
  await enterHand(second, {caller: team2, zvanja: {[team2]: [50]}, points: {team: team2, game: 90}});
  const afterNext = plus(afterFirst, [72, 140]);
  await expect(handRow(second, 4)).toHaveAccessibleName(row(4, [72, 140], afterNext));
  match = await stored(db, matchId);
  expect(match.hands.slice(2)).toEqual([
    [100, 62],
    [72, 140],
  ]);
  expect(match.score).toEqual(afterNext);

  // the first phone's board picks the second phone's hand up on its own refresh, without a reload
  await first.clock.fastForward(15_000);
  await expect(handRows(first)).toHaveCount(4);
  await expect(handRow(first, 4)).toHaveAccessibleName(row(4, [72, 140], afterNext));
  await expectTotal(first, team2, afterNext[1]);
  await healthy(first);
  await healthy(second);
});

test("both phones tap Spremi at the same moment: the hand is saved once and the other phone is asked (#57)", async ({twoPhones, db, healthy}) => {
  const {matchId, team1, phones} = twoPhones;
  const start = seededScore(twoPhones);

  // both phones enter the same hand from the board with 2 hands: team1 called with a 20 and took 95 → 115 : 67
  const hand: Hand = {caller: team1, zvanja: {[team1]: [20]}, points: {team: team1, game: 95}};
  for (const phone of phones) {
    await openNewHand(phone);
    await fillHand(phone, hand);
  }
  // each save is held until both phones have sent theirs, so they reach the server together
  let bothSent!: () => void;
  const together = new Promise<void>((resolve) => (bothSent = resolve));
  let sent = 0;
  for (const phone of phones) {
    await phone.route("**/api/ongoing-bela-result", async (route) => {
      if (route.request().method() === "POST" && ++sent === 2) bothSent();
      await together;
      // on to the context's own route (its X-Forwarded-For)
      await route.fallback();
    });
  }
  await Promise.all(phones.map((phone) => phone.getByRole("button", {name: "Spremi", exact: true}).click()));

  // one phone saved and is back on its board, the other is asked about the hand the first one saved
  const once = plus(start, [115, 67]);
  await expect
    .poll(async () => Promise.all(phones.map((phone) => sameHandQuestion(phone).isVisible())), {message: "one of the phones is asked"})
    .toContainEqual(true);
  const askedAt = (await Promise.all(phones.map((phone) => sameHandQuestion(phone).isVisible()))).indexOf(true);
  const asked = phones[askedAt];
  const saved = phones[1 - askedAt];
  await expect(sameHandQuestion(saved)).toHaveCount(0);
  await expect(handRows(saved)).toHaveCount(3);
  await expect(handRow(saved, 3)).toHaveAccessibleName(row(3, [115, 67], once));
  const question = sameHandQuestion(asked);
  await expect(question).toContainText("S drugog mobitela je upisana igra 3 (115 : 67). Ako je to ova ista igra, odustani.");
  let match = await stored(db, matchId);
  expect(match.hands.slice(2)).toEqual([[115, 67]]);
  expect(match.score).toEqual(once);

  // Odustani: both boards show the hand once
  await question.getByRole("button", {name: "Odustani"}).click();
  await expect(handRows(asked)).toHaveCount(3);
  await expect(handRow(asked, 3)).toHaveAccessibleName(row(3, [115, 67], once));
  match = await stored(db, matchId);
  expect(match.hands.slice(2)).toEqual([[115, 67]]);
  expect(match.score).toEqual(once);
  for (const phone of phones) await healthy(phone);
});

test("closing the question with ✕ drops the copy like Odustani (#57)", async ({twoPhones, db, healthy}) => {
  const {matchId, team2, phones} = twoPhones;
  const [first, second] = phones;
  const start = seededScore(twoPhones);

  // team2 called and took 81 of 162: 81 is not more than 81, so it is pad and team1 takes all 162 → 162 : 0
  const hand: Hand = {caller: team2, points: {team: team2, game: 81}};
  await openNewHand(first);
  await enterHand(second, hand);
  const afterSecond = plus(start, [162, 0]);
  await expect(handRow(second, 3)).toHaveAccessibleName(row(3, [162, 0], afterSecond));

  await fillHand(first, hand);
  const question = await saveAndExpectQuestion(first);
  await expect(question).toContainText("S drugog mobitela je upisana igra 3 (162 : 0). Ako je to ova ista igra, odustani.");
  await question.getByRole("button", {name: "Zatvori"}).click();
  await expect(question).toBeHidden();
  await expect(first).toHaveURL(new RegExp(`/ongoing-match/${matchId}$`));
  await expect(handRows(first)).toHaveCount(3);
  await expect(handRow(first, 3)).toHaveAccessibleName(row(3, [162, 0], afterSecond));

  const match = await stored(db, matchId);
  expect(match.hands.slice(2)).toEqual([[162, 0]]);
  expect(match.score).toEqual(afterSecond);
  await healthy(first);
});

test("Upiši i ovu saves the same hand again on purpose: two identical hands in a row (#57)", async ({twoPhones, db, healthy}) => {
  const {matchId, team2, phones} = twoPhones;
  const [first, second] = phones;
  const start = seededScore(twoPhones);

  // the first phone is in Upiši igru while the second saves: team2 called and took 120 of 162 → 42 : 120
  const hand: Hand = {caller: team2, points: {team: team2, game: 120}};
  await openNewHand(first);
  await enterHand(second, hand);
  const once = plus(start, [42, 120]);

  // two such hands were really played: the first phone confirms its own
  await fillHand(first, hand);
  const question = await saveAndExpectQuestion(first);
  await expect(question).toContainText("S drugog mobitela je upisana igra 3 (42 : 120). Ako je to ova ista igra, odustani.");
  await question.getByRole("button", {name: "Upiši i ovu"}).click();
  await expect(question).toBeHidden();
  await expect(first).toHaveURL(new RegExp(`/ongoing-match/${matchId}$`));
  const twice = plus(once, [42, 120]);
  await expect(handRows(first)).toHaveCount(4);
  await expect(handRow(first, 3)).toHaveAccessibleName(row(3, [42, 120], once));
  await expect(handRow(first, 4)).toHaveAccessibleName(row(4, [42, 120], twice));
  await expectTotal(first, team2, twice[1]);

  const match = await stored(db, matchId);
  expect(match.hands.slice(2)).toEqual([
    [42, 120],
    [42, 120],
  ]);
  expect(match.score).toEqual(twice);
  await healthy(first);
});

test("a correction saved on one phone while the other is entering a new hand: the new hand saves without a question", async ({
  twoPhones,
  db,
  healthy,
}) => {
  const {matchId, team1, team2, seeded, phones} = twoPhones;
  const [first, second] = phones;
  const start = seededScore(twoPhones);

  // the first phone opens Upiši igru; meanwhile the second corrects Igra 2: team1 called and took 100, no zvanja → 100 : 62
  await openNewHand(first);
  await correctHand(second, 2, {caller: team1, zvanja: {}, points: {team: team1, game: 100}});
  const corrected = plus(start, [-seeded[1].total1, -seeded[1].total2], [100, 62]);
  await expect(handRow(second, 2)).toHaveAccessibleName(row(2, [100, 62], plus([seeded[0].total1, seeded[0].total2], [100, 62])));

  // the board still has as many hands as when the first phone opened its entry: Spremi saves, no question.
  // team2 called with a 50 and took 90 → 72 : 90 + 50
  await fillHand(first, {caller: team2, zvanja: {[team2]: [50]}, points: {team: team2, game: 90}});
  await saveHand(first);
  const after = plus(corrected, [72, 140]);
  await expect(handRows(first)).toHaveCount(3);
  await expect(handRow(first, 2)).toHaveAccessibleName(row(2, [100, 62], plus([seeded[0].total1, seeded[0].total2], [100, 62])));
  await expect(handRow(first, 3)).toHaveAccessibleName(row(3, [72, 140], after));
  await expectTotal(first, team1, after[0]);
  await expectTotal(first, team2, after[1]);

  // Igra 2 changed in place, one new hand after it
  const match = await stored(db, matchId);
  expect(match.ids.slice(0, 2)).toEqual(seeded.map((h) => h.id));
  expect(match.hands).toEqual([[seeded[0].total1, seeded[0].total2], [100, 62], [72, 140]]);
  expect([match.rows[1].trump_caller_team, match.rows[1].pass, match.rows[1].belaPlayerAnnouncements]).toEqual([1, true, []]);
  expect(match.score).toEqual(after);
  await healthy(first);
  await healthy(second);
});

test("a new hand saved on one phone while the other is correcting a hand: the correction saves in place, and its board shows both", async ({
  twoPhones,
  db,
  healthy,
}) => {
  const {matchId, team1, team2, seeded, phones} = twoPhones;
  const [first, second] = phones;
  const start = seededScore(twoPhones);

  // the first phone opens Igra 2 to correct it; meanwhile the second saves a new hand: team1 called and took 100 → 100 : 62
  await openHand(first, 2);
  await enterHand(second, {caller: team1, points: {team: team1, game: 100}});
  await expect(handRows(second)).toHaveCount(3);

  // Igra 2 becomes: team2 called with its bela and took only 60, 60 + 20 against 102 is pad → team1 takes 162 + 20
  await fillHand(first, {caller: team2, zvanja: {[team2]: [20]}, points: {team: team2, game: 60}});
  await saveHand(first);
  const throughTwo = plus([seeded[0].total1, seeded[0].total2], [182, 0]);
  const after = plus(start, [-seeded[1].total1, -seeded[1].total2], [182, 0], [100, 62]);
  await expect(handRows(first)).toHaveCount(3);
  await expect(handRow(first, 2)).toHaveAccessibleName(row(2, [182, 0], throughTwo));
  await expect(handRow(first, 3)).toHaveAccessibleName(row(3, [100, 62], after));
  await expectTotal(first, team1, after[0]);
  await expectTotal(first, team2, after[1]);

  // Igra 2 changed in place (the caller's bela kept with the pad), the second phone's hand after it
  const match = await stored(db, matchId);
  expect(match.ids.slice(0, 2)).toEqual(seeded.map((h) => h.id));
  expect(match.hands).toEqual([[seeded[0].total1, seeded[0].total2], [182, 0], [100, 62]]);
  expect([match.rows[1].trump_caller_team, match.rows[1].pass, match.rows[1].belaPlayerAnnouncements.map((a) => [a.team, a.announcement_type])]).toEqual([
    2,
    false,
    [[2, "TWENTY"]],
  ]);
  expect(match.score).toEqual(after);
  await healthy(first);
});
