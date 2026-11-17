// C5 · Otključaj partiju stays the manual way on a tournament's table (c826481, DECISIONS #89 and #97): a finished
// match the admin's correction leaves under 1001 goes back in play by itself only while nothing came after it. A
// table of Kolo 1 when Kolo 2 is out can't: the warning says so, Obriši svejedno leaves the match without a winner and
// the table locked ("Partija je odigrana do kraja i zaključana."), and Otključaj partiju puts the match back in play
// with its hands and the minutes the admin picks.
// The table is the first played table of Kolo 1 of tournaments.live ("Subotnji turnir uživo", one match per Kolo), as
// the generator has no tournament of C5's own (asked for in C5's report); the fixture puts the hand back, closes the
// match again through the admin's routes and gives the table and its match back the fields the unlock wrote (its own
// Vrijeme partije, Tu smo, the match's times). The match's row is a new one afterwards.
import {expect, test as base} from "../../helpers/fixtures";
import {cantReopen, decidingHand, deleteHand, expectHand, finishedMatches, handShape, noWinnerSheet, openTable, putBackDecidingHand, type FinishedMatch} from "../../helpers/c5";
import {expectTotal, handRows} from "../../helpers/scorepad";

type Locked = {tournamentId: number; roundId: number; names: [string, string]; match: FinishedMatch};

const test = base.extend<{locked: Locked}>({
  locked: async ({api, db, world}, use) => {
    const tournamentId = world.tournaments.live.id;
    const kolos = await db.round.findMany({
      where: {tournamentRounds: {some: {tournament_id: tournamentId}}},
      orderBy: [{round_number: "asc"}, {table_number: "asc"}],
      include: {team1: true, team2: true, matches: {include: {_count: {select: {belaResults: true}}}}},
    });
    expect(kolos.some((r) => r.round_number === 2 && r.status === "PUBLISHED"), "the tournament's Kolo 2 is out").toBe(true);
    const round = kolos.find((r) => r.round_number === 1 && !r.open && r.attendance == null && r.matches.length === 1 && r.matches[0]._count.belaResults > 0);
    if (!round) throw new Error(`tournament ${tournamentId} has no played table in Kolo 1`);
    const [match] = await finishedMatches(db, round.id);
    const {hand} = decidingHand(match);
    const fields = {
      open: round.open,
      active: round.active,
      game_minutes: round.game_minutes,
      attendance: round.attendance,
      attendance_team_id: round.attendance_team_id,
      attendance_by: round.attendance_by,
      attendance_at: round.attendance_at,
    };
    await use({tournamentId, roundId: round.id, names: [round.team1.team_name, round.team2.team_name], match});
    await putBackDecidingHand(await api("admin"), db, round.id, 0, hand, match.belaResults.length);
    await db.round.update({where: {id: round.id}, data: fields});
    // the match closed again is a new row with the unlock's and the closing's times: the times it was played at (its
    // id stays the new one)
    const times = {match_date: match.match_date, start_time: match.start_time, end_time: match.end_time, time_expired: match.time_expired};
    await db.match.updateMany({where: {round_id: round.id}, data: times});
  },
});

test("Kolo 1's table when Kolo 2 is out: the warning says why the match can't go back in play, the table stays locked, and Otključaj partiju puts it back in play with the minutes the admin picks", async ({
  as,
  db,
  locked: {tournamentId, roundId, names, match},
  healthy,
}) => {
  const {hand, without} = decidingHand(match);
  const n = match.belaResults.length;
  const page = await as("admin");
  await openTable(page, `/turniri/${tournamentId}/stol/${roundId}`);
  await expect(page.getByText("Partija je odigrana do kraja i zaključana.")).toBeVisible();
  await expectHand(page, n, hand, [match.player_pair1_score, match.player_pair2_score]);

  // Obriši igru on the deciding hand: it can't reopen by itself, so the warning, then Obriši svejedno
  await deleteHand(page, n);
  const warning = noWinnerSheet(page);
  await expect(warning).toContainText(cantReopen(without, "Sljedeće kolo je već složeno"));
  await warning.getByRole("button", {name: "Obriši svejedno"}).click();
  await expect(warning).toBeHidden();
  await expect(page.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: `Meč 1 ${without[0]} : ${without[1]} · završen`})).toBeChecked();
  await expect(page.getByRole("img", {name: "0 od 1 pobjede u kolu"})).toHaveCount(2);
  await expect(page.getByText("Partija je odigrana do kraja i zaključana.")).toBeVisible();
  const stillLocked = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([stillLocked.open, stillLocked.team1_wins, stillLocked.team2_wins, await db.ongoingMatch.count({where: {round_id: roundId}})]).toEqual([false, 0, 0, 0]);

  // Otključaj partiju with 20 minutes: the match goes on with its hands from now
  await page.getByRole("button", {name: "Otključaj partiju"}).click();
  const sheet = page.getByRole("dialog", {name: "Otključaj partiju"});
  await expect(sheet).toContainText("Zadnja odigrana partija se nastavlja s upisanim igrama, s novim vremenom od sada.");
  await sheet.getByRole("button", {name: "20 min", exact: true}).click();
  await expect(sheet.getByRole("button", {name: "20 min", exact: true})).toHaveAttribute("aria-pressed", "true");
  await sheet.getByRole("button", {name: "Otključaj · 20 min"}).click();
  await expect(sheet).toBeHidden();

  // the board: the match being played, its hands, Upiši igru, no lock
  await expect(page.getByRole("button", {name: "Upiši igru", exact: true})).toBeVisible();
  await expect(handRows(page)).toHaveCount(n - 1);
  await expectTotal(page, names[0], without[0]);
  await expectTotal(page, names[1], without[1]);
  await expect(page.getByRole("button", {name: "Otključaj partiju"})).toHaveCount(0);
  await expect(page.getByText("Partija je odigrana do kraja i zaključana.")).toHaveCount(0);
  await healthy(page);

  // the database: the match is the one being played (its hands with their zvanja), 20 minutes from now, on a table
  // that is open again with its own Vrijeme partije and Tu smo
  expect(await db.match.count({where: {round_id: roundId}})).toBe(0);
  const open = await db.ongoingMatch.findFirstOrThrow({
    where: {round_id: roundId},
    include: {belaResults: {orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}}},
  });
  expect(open.belaResults.map(handShape)).toEqual(match.belaResults.slice(0, -1).map(handShape));
  expect([open.player_pair1_score, open.player_pair2_score]).toEqual(without);
  const left = (open.ends_at!.getTime() - Date.now()) / 60_000;
  expect(left).toBeGreaterThan(19);
  expect(left).toBeLessThanOrEqual(20);
  const unlocked = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([unlocked.open, unlocked.game_minutes, unlocked.attendance, unlocked.team1_wins, unlocked.team2_wins]).toEqual([true, 20, "PRESENT", 0, 0]);
});
