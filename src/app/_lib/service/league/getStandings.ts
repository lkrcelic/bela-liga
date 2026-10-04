import {prisma} from "@/app/_lib/prisma";
import {TeamScore} from "@prisma/client";
import {BYE_TEAM_ID} from "@/app/_lib/bye";

export type LeagueStandingsRow = Omit<TeamScore, "id"> & {id: number | null; team: {team_name: string}};

// Every team of the league, also those that haven't finished a round yet (a TeamScore row is only written when a
// team finishes its first round): they are listed with zeros. Inactive teams stay in the table.
export async function getLeagueStandings(league_id: number): Promise<LeagueStandingsRow[]> {
  const [scores, leagueTeams] = await Promise.all([
    prisma.teamScore.findMany({
      include: {team: {select: {team_name: true}}},
      where: {league_id, team_id: {not: BYE_TEAM_ID}},
    }),
    prisma.leagueTeam.findMany({
      where: {league_id, team_id: {not: BYE_TEAM_ID}},
      select: {team_id: true, team: {select: {team_name: true}}},
    }),
  ]);

  const scored = new Set(scores.map((s) => s.team_id));
  const notPlayedYet: LeagueStandingsRow[] = leagueTeams
    .filter((lt) => !scored.has(lt.team_id))
    .map((lt) => ({
      id: null,
      team_id: lt.team_id,
      league_id,
      tournament_id: null,
      rounds_played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      point_difference: 0,
      score: 0,
      team: lt.team,
    }));

  return [...scores, ...notPlayedYet].sort(
    (a, b) =>
      b.score - a.score ||
      b.point_difference - a.point_difference ||
      a.team.team_name.localeCompare(b.team.team_name, "hr")
  );
}
