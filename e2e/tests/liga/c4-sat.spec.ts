// C4 · Vrijeme partije, the clock on the players' scorepad, on the seeded table tables.timeLimit (league
// "E2E · Scorepad", the first match in play with 3 hands): a match without a deadline has no timer; with one, the
// timer in the board's head shows the time the database leaves, and in the last 5 minutes "Još m:ss do kraja partije"
// shows the real time left once per match (DECISIONS "Vrijeme partije holds for the league too", CHANGELOG 07.11.).
// The test gives the match a deadline in the future and takes it away again afterwards, so the match stays open and
// /api/cron/tick never closes it. The phone's clock is a fake one (page.clock) that the test moves a few seconds on to
// see the timer count down.
import {expect, test as base} from "../../helpers/fixtures";
import {expectCountdown, expectTimer, moveDeadline} from "../../helpers/c4";
import {freshClock, handRows} from "../../helpers/scorepad";

const test = base.extend<{seeded: {matchId: number; phone: string}}>({
  seeded: async ({db, world}, use) => {
    const table = world.tables.timeLimit;
    const matchId = table.matchId!;
    const before = await db.ongoingMatch.findUnique({where: {id: matchId}, select: {started_at: true, ends_at: true}});
    if (!before) throw new Error(`tables.timeLimit's match ${matchId} is no longer open: reseed with e2e/local/app.sh`);
    await use({matchId, phone: table.team1[0]});
    await db.ongoingMatch.updateMany({where: {id: matchId}, data: before});
  },
});

test("the timer on the scorepad shows the time left that the database holds, and Još m:ss do kraja partije shows once in the last 5 minutes", async ({
  as,
  db,
  seeded,
  healthy,
}) => {
  const {matchId, phone} = seeded;
  // as seeded: started before the limit came in, so no deadline and no timer
  await db.ongoingMatch.update({where: {id: matchId}, data: {ends_at: null}});
  const page = await as(phone);
  await page.clock.install();
  await page.goto(`/ongoing-match/${matchId}`);
  await expect(handRows(page)).toHaveCount(3);
  await expect(page.getByRole("button", {name: "Upiši igru", exact: true})).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);

  // 23:41 left
  await freshClock(db, matchId, 24);
  const endsAt = await moveDeadline(db, matchId, 23 * 60 + 41);
  await page.reload();
  await expect(handRows(page)).toHaveCount(3);
  await expect(page.getByRole("timer")).toHaveAccessibleName(/^Do kraja partije 23:(4[01]|3\d)$/);
  await expectTimer(page, endsAt);
  await expectCountdown(page);
  // more than 5 minutes left: no warning
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // 4:27 left: the warning says the real time left (opened later than at 5:00), and that a hand not yet saved doesn't count
  const late = await moveDeadline(db, matchId, 4 * 60 + 27);
  await page.reload();
  const warning = page.getByRole("dialog");
  await expect(warning.getByRole("heading", {name: /^Još 4:(2\d|1\d)\s*do kraja partije$/})).toBeVisible();
  await expect(warning).toContainText("Kad vrijeme istekne, partija završava s rezultatom koji je tada upisan, a igra koja još nije spremljena ne računa se.");
  await warning.getByRole("button", {name: "U redu"}).click();
  await expect(warning).toHaveCount(0);
  // the board under the warning was hidden from screen readers; now its timer reads the same time left
  await expectTimer(page, late);
  await expect(page.getByRole("button", {name: "Upiši igru", exact: true})).toBeVisible();

  // once per match: opened again, the board counts down under 5 minutes with no warning
  await page.reload();
  await expect(handRows(page)).toHaveCount(3);
  await expectTimer(page, late);
  await expectCountdown(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await healthy(page);
});
