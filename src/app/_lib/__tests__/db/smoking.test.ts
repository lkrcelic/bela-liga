import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {leagueNight} from "@/app/_lib/dates";
import {Team, TeamPair} from "@/app/_lib/matching/multipleRoundMatching";
import {seatRounds} from "@/app/_lib/matching/smokingTables";
import {smokingPlan, smokingSetup} from "@/app/_lib/service/round/smoking";
import {makeKoloDraft} from "@/app/_lib/service/tournament/kola";
import {updateTournament} from "@/app/_lib/service/tournament/tournaments";
import {TournamentRequest} from "@/app/_interfaces/tournament";

// Smoking tables (DECISIONS 100) against a real Postgres: every league night and every tournament starts afresh, and the
// match with the most smokers gets the smoking table. A tournament has its own Pušački stolovi: its Kolos are seated
// at them, counting only its own earlier Kolos, and new smoking tables drop the waiting draft. Run with
// `npm run test:db` on a throwaway database with the migrations applied (it adds its own league, tournaments, teams
// and players and removes them afterwards).

const tag = `sm${Date.now()}`;
const tonight = leagueNight();
const lastWeek = new Date(tonight.getTime() - 7 * 86_400_000);
let leagueId = 0;
let locationId = 0;
const tournaments: number[] = [];
const players: number[] = [];
// A has two smokers, C and E one each; B, D and F none
const SMOKERS: Record<string, number> = {A: 2, B: 0, C: 1, D: 0, E: 1, F: 0};
const id: Record<string, number> = {};
const nameOf = (teamId: number) => Object.keys(id).find((k) => id[k] === teamId) ?? String(teamId);

before(async () => {
  locationId = (await prisma.location.create({data: {name: `${tag} Kartaš`}})).location_id;
  leagueId = (await prisma.league.create({data: {league_name: `${tag} liga`, location_id: locationId}})).league_id;
  for (const [name, smokers] of Object.entries(SMOKERS)) {
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`}});
    id[name] = team.team_id;
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
    // two players a team, the first `smokers` of them smoke
    for (let i = 0; i < 2; i++) {
      const p = await prisma.player.create({
        data: {first_name: tag, last_name: `${name}${i}`, username: `${tag}${name}${i}`.toLowerCase(), password_hash: "x", email: `${tag}${name}${i}@test.local`.toLowerCase(), player_role: "PLAYER", smoker: i < smokers},
      });
      players.push(p.id);
      await prisma.teamPlayer.create({data: {team_id: team.team_id, player_id: p.id}});
    }
  }
});

after(async () => {
  const where = {OR: [{leagueRounds: {some: {league_id: leagueId}}}, {tournamentRounds: {some: {tournament_id: {in: tournaments}}}}]};
  const ids = (await prisma.round.findMany({where, select: {id: true}})).map((r) => r.id);
  await prisma.match.deleteMany({where: {round_id: {in: ids}}});
  await prisma.round.deleteMany({where: {id: {in: ids}}});
  await prisma.tournament.deleteMany({where: {tournament_id: {in: tournaments}}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.team.deleteMany({where: {team_id: {in: Object.values(id)}}});
  await prisma.player.deleteMany({where: {id: {in: players}}});
  await prisma.location.delete({where: {location_id: locationId}});
  await prisma.$disconnect();
});

// a table as it was seated: its teams' smokers then, and whether it is a smoking table
const seatedTable = (a: string, b: string, table: number, smoking: boolean) => ({
  team1_id: id[a],
  team2_id: id[b],
  table_number: table,
  smoking_table: smoking,
  team1_smokers: SMOKERS[a],
  team2_smokers: SMOKERS[b],
});

test("a league night starts afresh, and the match with more smokers gets the smoking table", async () => {
  const leagueRound = (date: Date, roundNumber: number, table: ReturnType<typeof seatedTable>) =>
    prisma.round.create({data: {...table, round_number: roundNumber, round_date: date, status: "PUBLISHED", published_at: date, leagueRounds: {create: {league_id: leagueId}}}});
  // last week C (one smoker) sat at an ordinary table while A had the smoking table: that night doesn't count tonight
  await leagueRound(lastWeek, 6, seatedTable("A", "B", 1, true));
  await leagueRound(lastWeek, 6, seatedTable("C", "D", 2, false));
  // tonight's Kolo 7: A already sat at the smoking table
  await leagueRound(tonight, 7, seatedTable("A", "D", 1, true));
  await leagueRound(tonight, 7, seatedTable("C", "B", 2, false));

  const smokers = new Map(Object.entries(SMOKERS).filter(([, n]) => n > 0).map(([k, n]) => [id[k], n]));
  const setup = await smokingSetup(leagueId, [1], smokers);
  // only tonight's turn counts, not last week's
  assert.deepEqual(setup.turns, new Map([[id.A, 1]]));

  const team = (k: string): Team => ({id: id[k], name: k, score: 0, point_difference: 0, played_against: []});
  const pairs: TeamPair[] = [
    {teamOne: team("C"), teamTwo: team("D")},
    {teamOne: team("A"), teamTwo: team("B")},
  ];
  const [seated] = seatRounds([pairs], setup);
  // two smokers beat one, though A sat at the smoking table earlier tonight and C went last week without one
  assert.deepEqual(
    seated.map((p) => [nameOf(p.teamOne.id), nameOf(p.teamTwo.id), p.table, p.smoking]),
    [
      ["A", "B", 1, true],
      ["C", "D", 2, false],
    ]
  );

  // Pušački raspored shows tonight only
  const plan = await smokingPlan(leagueId);
  assert.deepEqual(
    plan.teams.map((t) => [nameOf(t.id), t.smokers, t.tonight]),
    [
      ["A", 2, [true]],
      ["C", 1, [false]],
      ["E", 1, [null]],
    ]
  );
});

const today = () => new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

async function tournament(teams: string[], data: {smoking_tables: number[]; started?: boolean}): Promise<number> {
  const t = await prisma.tournament.create({
    data: {
      tournament_name: `${tag} turnir`,
      date: today(),
      rounds: 3,
      matches_per_round: 1,
      registrations_open: false,
      smoking_tables: data.smoking_tables,
      ...(data.started && {started_at: new Date()}),
    },
  });
  tournaments.push(t.tournament_id);
  for (const k of teams) await prisma.tournamentTeam.create({data: {tournament_id: t.tournament_id, team_id: id[k]}});
  return t.tournament_id;
}

const draftOf = (tournamentId: number) =>
  prisma.round.findMany({
    where: {tournamentRounds: {some: {tournament_id: tournamentId}}, status: "DRAFT"},
    select: {team1_id: true, team2_id: true, table_number: true, smoking_table: true, team1_smokers: true, team2_smokers: true},
    orderBy: {table_number: "asc"},
  });

test("a tournament seats Kolo 1's match with the most smokers at its smoking table; new smoking tables make the draft again", async () => {
  const t = await tournament(["A", "B", "C", "D"], {smoking_tables: [2]});
  await makeKoloDraft(t);
  let draft = await draftOf(t);
  // the draw is random, but A (two smokers) has the most smokers at any table it gets
  assert.deepEqual(
    draft.map((r) => [r.table_number, r.smoking_table]),
    [
      [1, false],
      [2, true],
    ]
  );
  const smoking = draft.find((r) => r.smoking_table)!;
  assert.ok([smoking.team1_id, smoking.team2_id].includes(id.A), "A's match sits at the smoking table");
  // each team's smokers are kept with the table
  for (const r of draft) assert.deepEqual([r.team1_smokers, r.team2_smokers], [SMOKERS[nameOf(r.team1_id)], SMOKERS[nameOf(r.team2_id)]]);

  // Podaci: table 1 becomes the smoking table instead; the draft seated at table 2 goes
  const request: TournamentRequest = {
    name: `${tag} turnir`,
    date: today().toISOString().slice(0, 10),
    gathering_time: null,
    start_time: null,
    location_id: null,
    rounds: 3,
    matches_per_round: 1,
    declarations: true,
    max_teams: null,
    entry_fee: 0,
    rules_url: null,
    prizes: [],
    game_minutes: 35,
    auto_publish: false,
    open_signups: false,
    hide_entries: false,
    organizer_phone: null,
    smoking_tables: [1],
  };
  await updateTournament(t, request);
  assert.equal((await draftOf(t)).length, 0);
  assert.deepEqual((await prisma.tournament.findUnique({where: {tournament_id: t}}))!.smoking_tables, [1]);

  await makeKoloDraft(t);
  draft = await draftOf(t);
  assert.deepEqual(draft.map((r) => r.smoking_table), [true, false]);
  assert.ok([draft[0].team1_id, draft[0].team2_id].includes(id.A));
});

test("in a later Kolo, of matches with as many smokers the team that sat at the smoking table fewer times goes first", async () => {
  const t = await tournament(["A", "B", "C", "D", "E", "F"], {smoking_tables: [1], started: true});
  // Kolo 1 and 2, played: C won both and sat at the smoking table in Kolo 2; E (one smoker too) never did
  const kolo = async (number: number, table: ReturnType<typeof seatedTable>) =>
    prisma.round.create({
      data: {
        ...table,
        round_number: number,
        round_date: today(),
        status: "PUBLISHED",
        published_at: new Date(),
        matches_per_round: 1,
        open: false,
        team1_wins: 1,
        team2_wins: 0,
        tournamentRounds: {create: {tournament_id: t}},
      },
    });
  await kolo(1, seatedTable("A", "B", 1, true));
  await kolo(1, seatedTable("C", "E", 2, false));
  await kolo(1, seatedTable("D", "F", 3, false));
  await kolo(2, seatedTable("C", "A", 1, true));
  await kolo(2, seatedTable("E", "D", 2, false));
  await kolo(2, seatedTable("B", "F", 3, false));

  await makeKoloDraft(t);
  const draft = await draftOf(t);
  const tableOf = (k: string) => draft.find((r) => r.team1_id === id[k] || r.team2_id === id[k])!;
  // C leads the standings, so its match is the pairing's first; but C and E have one smoker each and C already had a
  // turn in this tournament, so E's match gets the smoking table
  assert.equal(tableOf("E").table_number, 1);
  assert.equal(tableOf("E").smoking_table, true);
  assert.equal(tableOf("C").smoking_table, false);
  assert.equal(draft.filter((r) => r.smoking_table).length, 1);
});
