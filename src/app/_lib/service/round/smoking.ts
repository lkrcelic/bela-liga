import {Prisma} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {BYE_TEAM_ID, isByeTeam} from "@/app/_lib/bye";
import {leagueNightString} from "@/app/_lib/dates";
import {SmokingSetup, SmokingTable, smokingTurns} from "@/app/_lib/matching/smokingTables";
import {SmokingPlan, SmokingPlanSide, SmokingPlanTeam} from "@/app/_interfaces/smoking";
import {NotFoundError} from "@/app/_lib/service/admin/tables";
import {draftLetters, roundName, roundStatusOf} from "@/app/_lib/roundStatus";
import {teamSmokers} from "@/app/_lib/service/team/smokers";
import {Slot} from "@/app/_lib/locations";

// Smoking tables on the database side: tonight's tables of the league as the rule reads them (every night starts
// afresh, DECISIONS 100), and the plan admins see in Create Round

type Db = Prisma.TransactionClient | typeof prisma;

const roundSelect = {
  round_number: true,
  table_number: true,
  team1_id: true,
  team2_id: true,
  team1_smokers: true,
  team2_smokers: true,
  smoking_table: true,
  status: true,
  draft_order: true,
  location_slot: true,
} as const;

type RoundRow = Prisma.RoundGetPayload<{select: typeof roundSelect}>;

export const toSmokingTable = (r: Pick<RoundRow, "team1_id" | "team2_id" | "team1_smokers" | "team2_smokers" | "smoking_table">): SmokingTable => ({
  team1Id: r.team1_id,
  team2Id: r.team2_id,
  team1Smokers: r.team1_smokers,
  team2Smokers: r.team2_smokers,
  smoking: r.smoking_table,
});

// The league's tables tonight (both places of a two-place night: a team plays at one of them)
async function tonightRounds(leagueId: number, today: string, db: Db): Promise<RoundRow[]> {
  return db.round.findMany({
    where: {leagueRounds: {some: {league_id: leagueId}}, round_date: new Date(`${today}T00:00:00.000Z`)},
    select: roundSelect,
  });
}

// What Create Round seats tonight's new rounds with: the smoking tables, the teams' smokers and their turns at a smoking
// table in tonight's earlier rounds
export async function smokingSetup(leagueId: number, tables: number[], smokers: Map<number, number>, db: Db = prisma): Promise<SmokingSetup> {
  const rounds = await tonightRounds(leagueId, leagueNightString(), db);
  return {tables, smokers, turns: smokingTurns(rounds.map(toSmokingTable))};
}

// Tonight's smoking tables round by round, and where every smoking team sat in each of tonight's rounds (admin). slot:
// at one place of a two-place night, that place's rounds tonight.
export async function smokingPlan(leagueId: number, slot: Slot | null = null): Promise<SmokingPlan> {
  const league = await prisma.league.findUnique({
    where: {league_id: leagueId},
    select: {
      smoking_tables: true,
      leagueTeams: {where: {team_id: {not: BYE_TEAM_ID}}, select: {team: {select: {team_id: true, team_name: true}}}},
    },
  });
  if (!league) throw new NotFoundError("Liga ne postoji.");

  const today = leagueNightString();
  const teams = league.leagueTeams.map((lt) => lt.team);
  const [smokers, rounds] = await Promise.all([teamSmokers(teams.map((t) => t.team_id)), tonightRounds(leagueId, today, prisma)]);
  const names = new Map(teams.map((t) => [t.team_id, t.team_name]));

  const tonight = rounds.filter((r) => r.round_number != null && (slot == null || r.location_slot === slot));
  const roundNumbers = Array.from(new Set(tonight.map((r) => r.round_number!))).sort((a, b) => a - b);
  // a round still waiting in Skica is called by its letter
  const letters = draftLetters(
    roundNumbers.map((n) => {
      const tables = tonight.filter((r) => r.round_number === n);
      return {roundNumber: n, status: roundStatusOf(tables), draftOrder: tables[0].draft_order};
    })
  );
  const roundNames = roundNumbers.map((n) => roundName({roundNumber: n, letter: letters.get(n) ?? null}));
  // a team removed from the league can still have a table tonight
  const missing = tonight.flatMap((r) => [r.team1_id, r.team2_id]).filter((id) => !isByeTeam(id) && !names.has(id));
  if (missing.length) {
    const extra = await prisma.team.findMany({where: {team_id: {in: missing}}, select: {team_id: true, team_name: true}});
    extra.forEach((t) => names.set(t.team_id, t.team_name));
  }
  const side = (id: number, smokers: number): SmokingPlanSide => ({id, name: names.get(id) ?? `Ekipa ${id}`, smokers});

  // teams that had a smoker at one of tonight's tables (a smoker may have left the team since)
  const smokedTonight = new Set(tonight.flatMap((r) => [...(r.team1_smokers > 0 ? [r.team1_id] : []), ...(r.team2_smokers > 0 ? [r.team2_id] : [])]));
  const rotation: SmokingPlanTeam[] = teams
    .map((t) => ({
      id: t.team_id,
      name: t.team_name,
      smokers: smokers.get(t.team_id) ?? 0,
      tonight: roundNumbers.map((n) => {
        const table = tonight.find((r) => r.round_number === n && (r.team1_id === t.team_id || r.team2_id === t.team_id));
        return table && !isByeTeam(table.team1_id) && !isByeTeam(table.team2_id) ? table.smoking_table : null;
      }),
    }))
    .filter((t) => t.smokers > 0 || smokedTonight.has(t.id))
    .sort((a, b) => b.smokers - a.smokers || a.name.localeCompare(b.name, "hr"));

  return {
    date: today,
    tables: league.smoking_tables,
    roundNumbers,
    roundNames,
    rounds: roundNumbers.map((n, i) => ({
      roundNumber: n,
      name: roundNames[i],
      tables: tonight
        .filter((r) => r.round_number === n && r.smoking_table)
        .sort((a, b) => (a.table_number ?? 0) - (b.table_number ?? 0))
        .map((r) => ({table: r.table_number ?? 0, teams: [side(r.team1_id, r.team1_smokers), side(r.team2_id, r.team2_smokers)] as [SmokingPlanSide, SmokingPlanSide]})),
    })),
    teams: rotation,
  };
}
