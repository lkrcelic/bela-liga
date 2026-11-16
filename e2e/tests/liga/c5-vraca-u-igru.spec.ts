// C5 · the admin corrects a finished match and it goes back in play at its table (c826481, DECISIONS #97): a match
// closed with Završi meč that the admin's change leaves under 1001 for both teams is played again at its table, with
// the time it had left (Vrijeme partije minus the time it was played), when the table is tonight's and nothing came
// after it. Until it closes again the standings and the ratings don't count the table.
// Two ways in, on the admin's phone scorepad: Obriši igru on the deciding hand of tonight's last match (the seeded
// table tables.adminEdit in "E2E · Scorepad", Meč 2), and Ispravi korak po korak on Meč 1 of a table whose Meč 2 the
// closing has just opened (the test's own Kolo in the same league, removed afterwards).
// Expected numbers follow the Bela rules: a hand is 162 game points, the caller must score more than the other team,
// a match is won at 1001; a won round is 2 points in the standings.
import {expect, test as base} from "../../helpers/fixtures";
import {
  asHand,
  confirmLineup,
  decidingHand,
  deleteHand,
  expectHand,
  finishedMatches,
  handShape,
  lineup,
  moved,
  putBackDecidingHand,
  ratings,
  standings,
  winnerOf,
  type FinishedMatch,
} from "../../helpers/c5";
import {addHands, correctHand, enterHand, expectTotal, finishMatch, handRow, handRows, publishTable, removeKolo, startMatch, type Table} from "../../helpers/scorepad";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const minutesLeft = (endsAt: Date | null) => (endsAt!.getTime() - Date.now()) / 60_000;

type Seeded = {
  leagueId: number;
  roundId: number;
  roundNumber: number;
  table: number;
  names: [string, string];
  teamIds: [number, number];
  // Meč 1 and Meč 2 as seeded (or as the last run closed them again)
  matches: FinishedMatch[];
};

// tables.adminEdit: tonight's played table (2 matches) of the league's last Kolo. Whatever a run leaves of it (a match
// back in play, its deciding hand gone) is put back through the app's routes and closed again afterwards.
const test = base.extend<{seeded: Seeded}>({
  seeded: async ({api, db, world}, use) => {
    const {roundId} = world.tables.adminEdit;
    const round = await db.round.findUniqueOrThrow({where: {id: roundId}, include: {team1: true, team2: true}});
    const matches = await finishedMatches(db, roundId);
    expect([round.open, matches.length], "tables.adminEdit should be a played table of two matches").toEqual([false, 2]);
    const admin = await api("admin");
    const second = matches[1];
    await use({
      leagueId: world.leagues.scorepad.id,
      roundId,
      roundNumber: round.round_number!,
      table: round.table_number!,
      names: [round.team1.team_name, round.team2.team_name],
      teamIds: [round.team1_id, round.team2_id],
      matches,
    });
    await putBackDecidingHand(admin, db, roundId, 1, decidingHand(second).hand, second.belaResults.length);
    // a run that stopped before Obriši igru leaves Meč 2 with the start the test moved: back to what it was (a Meč 2
    // closed again by the players is a new row with its own times)
    await db.match.updateMany({where: {id: second.id}, data: {start_time: second.start_time}});
  },
});

test("Obriši igru on the deciding hand of tonight's last match puts it back in play with the time it had left, and the table leaves the standings and ratings until the players close it again", async ({
  as,
  db,
  world,
  seeded,
  healthy,
}) => {
  const {leagueId, roundId, roundNumber, table, names, teamIds, matches} = seeded;
  const [first, second] = matches;
  const {hand: deciding, without} = decidingHand(second);
  const n = second.belaResults.length;
  // Meč 2 was played for 20 minutes of its 35 (the seed plays it in a moment): it has 15 left
  await db.match.update({where: {id: second.id}, data: {start_time: new Date(second.end_time!.getTime() - 20 * 60_000)}});
  const {playerIds, phone, phoneId} = await lineup(db, roundId, teamIds[0]);
  const standingsBefore = await standings(db, leagueId, teamIds);
  const ratingsBefore = await ratings(db, playerIds);
  const tonight = world.leagues.scorepad.tonight!;
  // nobody at this table plays another table tonight, so tonight's rating rows are this table's alone
  for (const id of playerIds) expect(ratingsBefore[id].history.find((h) => h.night === tonight)?.rounds, `player ${id} tonight`).toBe(1);
  const [w1, w2] = wins(matches);
  const roundWinner = w1 === w2 ? null : w1 > w2 ? 1 : 2;

  // the admin: Dnevni poredak → Kolo 7 → the played table → Tko je igrao → its board on Meč 2
  const admin = await as("admin");
  await admin.goto(`/league/${leagueId}/daily-standings`);
  await admin.getByRole("tab", {name: new RegExp(`^Kolo ${roundNumber}\\b`)}).click();
  await admin.getByRole("link", {name: new RegExp(`^Stol ${table}: ${escape(names[0])} ${w1}, ${escape(names[1])} ${w2}, završeno`)}).click();
  await confirmLineup(admin);
  await expect(admin.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: /^Meč 2 /})).toBeChecked();
  await expect(admin.getByText("Runda je završena. Izmjene mijenjaju rezultat i poredak.")).toBeVisible();
  await expectHand(admin, n, deciding, [second.player_pair1_score, second.player_pair2_score]);

  // Obriši igru: no warning, Meč 2 is the match being played again, without the hand
  await deleteHand(admin, n);
  await expect(admin.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: "Meč 2 u tijeku"})).toBeChecked();
  await expect(admin.getByRole("dialog")).toHaveCount(0);
  await expect(handRows(admin)).toHaveCount(n - 1);
  await expectTotal(admin, names[0], without[0]);
  await expectTotal(admin, names[1], without[1]);
  await expect(admin.getByRole("button", {name: "Upiši igru", exact: true})).toBeVisible();
  await expect(admin.getByText(/Izmjene mijenjaju rezultat i poredak/)).toHaveCount(0);

  // the database: Meč 1 stays finished; Meč 2 is open with its other hands (zvanja and all) and 15 minutes; the
  // table is open and counts Meč 1 only
  expect((await finishedMatches(db, roundId)).map((m) => m.id)).toEqual([first.id]);
  const reopened = await db.ongoingMatch.findFirstOrThrow({
    where: {round_id: roundId},
    include: {belaResults: {orderBy: {result_id: "asc"}, include: {belaPlayerAnnouncements: true}}},
  });
  expect(reopened.belaResults.map(handShape)).toEqual(second.belaResults.slice(0, -1).map(handShape));
  expect([reopened.player_pair1_score, reopened.player_pair2_score]).toEqual(without);
  expect(minutesLeft(reopened.ends_at)).toBeGreaterThan(14);
  expect(minutesLeft(reopened.ends_at)).toBeLessThanOrEqual(15);
  const open = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([open.open, open.team1_wins, open.team2_wins]).toEqual([true, ...wins([first])]);

  // the standings no longer count the table: one round less for both, its win, its 2 points and its points difference
  const diff1 = matches.reduce((s, m) => s + m.player_pair1_score - m.player_pair2_score, 0);
  const dropped = (side: 1 | 2) => ({
    rounds_played: -1,
    wins: roundWinner === side ? -1 : 0,
    draws: roundWinner == null ? -1 : 0,
    losses: roundWinner != null && roundWinner !== side ? -1 : 0,
    score: roundWinner === side ? -2 : roundWinner == null ? -1 : 0,
    point_difference: side === 1 ? -diff1 : diff1,
  });
  const standingsOpen = await standings(db, leagueId, teamIds);
  expect(moved(standingsBefore[teamIds[0]], standingsOpen[teamIds[0]])).toEqual(dropped(1));
  expect(moved(standingsBefore[teamIds[1]], standingsOpen[teamIds[1]])).toEqual(dropped(2));
  // nor do the ratings: tonight's row is gone and each player is back on the rating of the last night they played
  const ratingsOpen = await ratings(db, playerIds);
  for (const id of playerIds) {
    const earlier = ratingsBefore[id].history.filter((h) => h.night !== tonight);
    expect(ratingsOpen[id], `player ${id}`).toEqual({rating: earlier[earlier.length - 1].rating, history: earlier});
  }

  // a player of the table: Početna has the table again (Nastavi igru) and the rating without tonight
  const player = await as(phone);
  await player.goto("/");
  await expect(player.getByRole("link", {name: `Rejting ${ratingsOpen[phoneId].rating}`})).toBeVisible();
  await player
    .getByRole("button", {name: new RegExp(`^STOL ${table}\\s*${without[0]} : ${without[1]}\\s*${escape(names[0])}\\s*${escape(names[1])}\\s*Nastavi igru$`)})
    .click();
  await expect(player).toHaveURL(new RegExp(`/ongoing-match/${reopened.id}$`));
  await expect(player.getByText("Meč 2 od 2")).toBeVisible();
  await expect(handRows(player)).toHaveCount(n - 1);
  await expect(player.getByRole("timer")).toHaveAccessibleName(/^Do kraja partije (14:\d\d|15:00)$/);

  // they play the hand again (the phone is team1's, so team1 is on the left) and close the match with Završi meč
  await enterHand(player, asHand(deciding, names));
  await expect(handRow(player, n)).toHaveAccessibleName(
    new RegExp(`^Igra ${n}: ${deciding.player_pair1_total_points} prema ${deciding.player_pair2_total_points}, ukupno ${second.player_pair1_score} prema ${second.player_pair2_score}, `),
  );
  expect(await finishMatch(player)).toBe("end");
  await expect(player.getByRole("heading", {name: "Kraj kola"})).toBeVisible();
  await expect(player.getByRole("list", {name: "Mečevi"}).getByRole("listitem")).toHaveText(
    matches.map((m, i) => new RegExp(`^Meč ${i + 1}\\s*${m.player_pair1_score}\\s*${m.player_pair2_score}$`)),
  );
  await healthy(player);
  await healthy(admin);

  // closed again as it was played: the table, the standings and the ratings are what they were before the correction
  const closed = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([closed.open, closed.team1_wins, closed.team2_wins]).toEqual([false, w1, w2]);
  expect(await standings(db, leagueId, teamIds)).toEqual(standingsBefore);
  expect(await ratings(db, playerIds)).toEqual(ratingsBefore);
});

// the matches each team won, by side
function wins(matches: FinishedMatch[]): [number, number] {
  const winners = matches.map((m) => winnerOf(m.player_pair1_score, m.player_pair2_score));
  return [winners.filter((w) => w === 1).length, winners.filter((w) => w === 2).length];
}

type Own = {leagueId: number; roundId: number; table: Table; matchTwo: number; phone: string};

// A Kolo of its own in "E2E · Scorepad" (the next number tonight), one table for the two teams of tables.adminEdit,
// whose own table is closed: Meč 1 played to 1014 : 120 from team1's phone and closed with Završi meč, which opened
// an empty Meč 2. Removed afterwards with every Kolo after the seeded one, so a run that stopped halfway leaves none.
const own = base.extend<{own: Own}>({
  own: async ({api, db, world}, use) => {
    const {id: leagueId, tonight} = world.leagues.scorepad;
    const admin = await api("admin");
    const seeded = await db.round.findUniqueOrThrow({where: {id: world.tables.adminEdit.roundId}});
    const later = async () => {
      const rounds = await db.round.findMany({
        where: {leagueRounds: {some: {league_id: leagueId}}, round_date: new Date(tonight!), round_number: {gt: seeded.round_number!}},
        distinct: ["round_number"],
      });
      for (const r of rounds) await removeKolo(admin, leagueId, tonight!, r.round_number!);
    };
    await later();
    const table = await publishTable(admin, db, leagueId, tonight!, [seeded.team1_id, seeded.team2_id]);
    const matchOne = await startMatch(admin, table.roundId);
    const team1 = await db.roundPlayer.findMany({where: {round_id: table.roundId, team_id: table.team1.id}, include: {player: true}, orderBy: {player: {username: "asc"}}});
    const phone = team1[0].player.username;
    const teammate = await api(phone);
    // six hands of 152 : 10 (912 : 60), then 102 : 60: team1 at 1014 : 120
    await addHands(teammate, matchOne, [...Array.from({length: 6}, () => ({caller: 1 as const, game1: 152})), {caller: 1, game1: 102}]);
    const finished = await teammate.post("/api/matches", {data: matchOne});
    expect(finished.ok(), `Završi meč: ${await finished.text()}`).toBeTruthy();
    const {nextOngoingMatchId} = (await finished.json()) as {nextOngoingMatchId: number | null};
    expect(nextOngoingMatchId, "Završi meč should open Meč 2").not.toBeNull();
    await use({leagueId, roundId: table.roundId, table, matchTwo: nextOngoingMatchId!, phone});
    await later();
  },
});

own("Ispravi korak po korak on Meč 1 right after Završi meč puts Meč 1 back in play with the time it had left: the empty Meč 2 is gone and the players' board follows", async ({
  as,
  db,
  own: {leagueId, roundId, table, matchTwo, phone},
  healthy,
}) => {
  const [first] = await finishedMatches(db, roundId);
  expect([first.player_pair1_score, first.player_pair2_score]).toEqual([1014, 120]);
  // Meč 1 was played for 25 of its 35 minutes: it has 10 left
  await db.match.update({where: {id: first.id}, data: {start_time: new Date(first.end_time!.getTime() - 25 * 60_000)}});

  // the players are on Meč 2, which nobody has started
  const player = await as(phone);
  await player.goto(`/ongoing-match/${matchTwo}`);
  await expect(player.getByText("Meč 2 od 2")).toBeVisible();
  await expect(player.getByText("Još nema upisanih igara")).toBeVisible();

  // the admin corrects Igra 7 of Meč 1: team1 took 82, not 102 → 82 : 80, and team1 has 994, under 1001
  const admin = await as("admin");
  await admin.goto(`/league/${leagueId}/daily-standings/table/${roundId}`);
  await confirmLineup(admin);
  await expect(admin.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: "Meč 2 nije počeo"})).toBeChecked();
  const tab = admin.getByRole("radiogroup", {name: "Meč"}).getByRole("radio", {name: "Meč 1 1014 : 120 · završen"});
  await tab.click();
  await expect(tab).toBeChecked();
  await correctHand(admin, 7, {points: {team: table.team1.name, game: 82}});

  // Meč 1 is the match being played: no Meč 1 · Meč 2 any more, Upiši igru, the corrected hand
  await expect(handRow(admin, 7)).toHaveAccessibleName(/^Igra 7: 82 prema 80, ukupno 994 prema 140, /);
  await expect(admin.getByRole("radiogroup", {name: "Meč"})).toHaveCount(0);
  await expect(admin.getByRole("button", {name: "Upiši igru", exact: true})).toBeVisible();
  await expectTotal(admin, table.team1.name, 994);
  await expectTotal(admin, table.team2.name, 140);
  await healthy(admin);

  // the database: no finished match, one open match (Meč 1 with its 7 hands, 10 minutes left), the empty Meč 2 gone
  expect(await db.match.count({where: {round_id: roundId}})).toBe(0);
  const open = await db.ongoingMatch.findMany({where: {round_id: roundId}, include: {_count: {select: {belaResults: true}}}});
  expect(open.map((m) => [m.id === matchTwo, m._count.belaResults, m.player_pair1_score, m.player_pair2_score])).toEqual([[false, 7, 994, 140]]);
  expect(minutesLeft(open[0].ends_at)).toBeGreaterThan(9);
  expect(minutesLeft(open[0].ends_at)).toBeLessThanOrEqual(10);
  const round = await db.round.findUniqueOrThrow({where: {id: roundId}});
  expect([round.open, round.team1_wins, round.team2_wins]).toEqual([true, 0, 0]);

  // the players' board, opened again (as it is when the phone is back in front), follows Meč 1
  await player.reload();
  await expect(player).toHaveURL(new RegExp(`/ongoing-match/${open[0].id}$`));
  await expect(player.getByText("Meč 1 od 2")).toBeVisible();
  await expect(handRows(player)).toHaveCount(7);
  await expectTotal(player, table.team1.name, 994);
  await expect(player.getByRole("timer")).toHaveAccessibleName(/^Do kraja partije (9:\d\d|10:00)$/);
  await expect(player.getByRole("button", {name: "Upiši igru", exact: true})).toBeVisible();
  await healthy(player);
});
