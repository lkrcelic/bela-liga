// C5 · the admin adds a hand to a finished match, on the computer (DECISIONS #24, #84, #97): "Meč ostaje bez
// pobjednika?" asks the admin to add the hands that were played ("dok ne dopišeš igre koje su odigrane"), and the
// computer's scorepad has the entry panel for a finished match too (the phone's finished match has no Upiši igru).
// The table is tables.adminEdit in "E2E · Scorepad", tonight's, played 2 : 0; its Meč 1 is left without a winner first
// (its deciding hand deleted past the warning, as Obriši svejedno does), and the fixture adds the hand back through
// the admin's route if the test didn't.
import {expect, test as base} from "../../helpers/fixtures";
import {
  adminDeleteFinishedHand,
  asHand,
  confirmLineup,
  decidingHand,
  enterHandOnComputer,
  finishedMatches,
  handShape,
  putBackDecidingHand,
  standings,
  type StoredHand,
} from "../../helpers/c5";
import {handRows} from "../../helpers/scorepad";

type NoWinner = {
  leagueId: number;
  roundId: number;
  names: [string, string];
  teamIds: [number, number];
  // the hand that was played and is missing, and the match as it was with it
  hand: StoredHand;
  played: {id: number; score: [number, number]; hands: number};
  // the table's wins as it was played
  wins: [number, number];
  standingsBefore: Awaited<ReturnType<typeof standings>>;
};

const test = base.extend<{noWinner: NoWinner}>({
  noWinner: async ({api, db, world}, use) => {
    const {roundId} = world.tables.adminEdit;
    const leagueId = world.leagues.scorepad.id;
    const round = await db.round.findUniqueOrThrow({where: {id: roundId}, include: {team1: true, team2: true}});
    const [first] = await finishedMatches(db, roundId);
    const {hand} = decidingHand(first);
    const teamIds: [number, number] = [round.team1_id, round.team2_id];
    const standingsBefore = await standings(db, leagueId, teamIds);
    const admin = await api("admin");
    await adminDeleteFinishedHand(admin, hand.result_id);
    await use({
      leagueId,
      roundId,
      names: [round.team1.team_name, round.team2.team_name],
      teamIds,
      hand,
      played: {id: first.id, score: [first.player_pair1_score, first.player_pair2_score], hands: first.belaResults.length},
      wins: [round.team1_wins, round.team2_wins],
      standingsBefore,
    });
    await putBackDecidingHand(admin, db, roundId, 0, hand, first.belaResults.length);
  },
});

test("the admin adds the hand that was played to Meč 1 left without a winner: Meč 1 is won again, and the table's wins and the standings are as before", async ({
  as,
  db,
  noWinner: {leagueId, roundId, names, teamIds, hand, played, wins, standingsBefore},
  healthy,
}) => {
  const without: [number, number] = [played.score[0] - hand.player_pair1_total_points, played.score[1] - hand.player_pair2_total_points];
  const winner = names[played.score[0] > played.score[1] ? 0 : 1];
  const page = await as("admin");
  await page.goto(`/league/${leagueId}/daily-standings/table/${roundId}`);
  // Tko je igrao first, as every time the table is opened
  await expect(page.getByRole("heading", {name: /^Tko (igra|je igrao) ovu rundu\?$/})).toBeVisible();
  await page.getByRole("button", {name: /^Potvrdi/}).click();
  await expect(page.getByRole("heading", {name: `${names[0]} vs ${names[1]}`})).toBeVisible();

  const firstTab = page.getByRole("button", {name: new RegExp(`^Meč 1 · ${without[0]} : ${without[1]}\\s*Bez pobjednika$`)});
  await firstTab.click();
  await expect(firstTab).toHaveAttribute("aria-pressed", "true");
  await expect(handRows(page)).toHaveCount(played.hands - 1);

  // Igra n: the hand as it was played, the caller, both teams' zvanja and the game points
  await expect(page.getByRole("region", {name: `Igra ${played.hands}`})).toBeVisible();
  await enterHandOnComputer(page, asHand(hand, names));
  await expect(page.getByRole("button", {name: new RegExp(`^Meč 1 · ${played.score[0]} : ${played.score[1]}\\s*Pobjeda: ${winner}$`)})).toBeVisible();
  await expect(handRows(page)).toHaveCount(played.hands);
  await expect(page.getByRole("region", {name: `Igra ${played.hands + 1}`})).toBeVisible();
  await healthy(page);

  // the database: Meč 1 with the hand again, the table back at its two wins, the standings as before the deletion
  const [first] = await finishedMatches(db, roundId);
  expect([first.id, first.player_pair1_score, first.player_pair2_score, first.belaResults.length]).toEqual([played.id, ...played.score, played.hands]);
  expect(handShape(first.belaResults[first.belaResults.length - 1])).toEqual(handShape(hand));
  const round = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([round.open, round.team1_wins, round.team2_wins]).toEqual([false, ...wins]);
  expect(await db.ongoingMatch.count({where: {round_id: roundId}})).toBe(0);
  expect(await standings(db, leagueId, teamIds)).toEqual(standingsBefore);
});
