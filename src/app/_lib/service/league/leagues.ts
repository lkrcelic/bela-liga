import {LeagueCreateRequest, LeagueSummary, LeagueTeamDetails} from "@/app/_interfaces/league";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {pickActiveLeague} from "@/app/_lib/league";
import {prisma} from "@/app/_lib/prisma";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import {Prisma} from "@prisma/client";

const dateString = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

// Every league, newest first, with its number of teams (the bye team is not counted), its latest round night
// and which one is being played now
export async function listLeagues(): Promise<LeagueSummary[]> {
  const [leagues, played] = await Promise.all([
    prisma.league.findMany({
      orderBy: {league_id: "desc"},
      include: {_count: {select: {leagueTeams: {where: {team_id: {not: BYE_TEAM_ID}}}}}},
    }),
    prisma.$queryRaw<{league_id: number; last_played: Date | null}[]>`
        SELECT lr.league_id, MAX(r.round_date) AS last_played
        FROM "LeagueRound" lr
                 JOIN "Round" r ON r.id = lr.round_id
        GROUP BY lr.league_id
    `,
  ]);
  const lastPlayed = new Map(played.map((p) => [p.league_id, dateString(p.last_played)]));
  const rows = leagues.map((l) => ({
    league_id: l.league_id,
    league_name: l.league_name,
    season: l.season,
    start_date: dateString(l.start_date),
    play_day: l.play_day,
    rounds_per_night: l.rounds_per_night,
    team_count: l._count.leagueTeams,
    last_played: lastPlayed.get(l.league_id) ?? null,
  }));
  const activeId = pickActiveLeague(rows);
  return rows.map((l) => ({...l, active: l.league_id === activeId}));
}

// The league being played now, or null when there are no leagues
export async function activeLeagueId(): Promise<number | null> {
  return (await listLeagues()).find((l) => l.active)?.league_id ?? null;
}

// Creates a league and, optionally, adds existing teams to it
export async function createLeague(req: LeagueCreateRequest): Promise<LeagueSummary> {
  const teamIds = Array.from(new Set(req.team_ids.filter((id) => id !== BYE_TEAM_ID)));
  if (teamIds.length) {
    const found = await prisma.team.count({where: {team_id: {in: teamIds}}});
    if (found !== teamIds.length) throw new InvalidResultError("Some of the teams don't exist.");
  }

  const league = await prisma.league.create({
    data: {
      league_name: req.league_name,
      season: req.season || null,
      start_date: req.start_date ? new Date(`${req.start_date}T00:00:00.000Z`) : null,
      play_day: req.play_day ?? null,
      rounds_per_night: req.rounds_per_night,
      leagueTeams: {create: teamIds.map((team_id) => ({team_id}))},
    },
  });

  return {
    league_id: league.league_id,
    league_name: league.league_name,
    season: league.season,
    start_date: dateString(league.start_date),
    play_day: league.play_day,
    rounds_per_night: league.rounds_per_night,
    team_count: teamIds.length,
    last_played: null,
    active: false,
  };
}

export async function leagueExists(leagueId: number): Promise<boolean> {
  return (await prisma.league.count({where: {league_id: leagueId}})) > 0;
}

// Teams of a league with their players, sorted by name
export async function listLeagueTeams(leagueId: number): Promise<LeagueTeamDetails[]> {
  const rows = await prisma.leagueTeam.findMany({
    where: {league_id: leagueId, team_id: {not: BYE_TEAM_ID}},
    include: {team: {include: {teamPlayers: {include: {player: {select: {id: true, username: true}}}}}}},
  });
  return rows
    .map((r) => ({
      team_id: r.team_id,
      team_name: r.team.team_name,
      active: r.active,
      players: r.team.teamPlayers.map((tp) => tp.player),
    }))
    .sort((a, b) => a.team_name.localeCompare(b.team_name, "hr"));
}

// Adds an existing team to a league (active). Adding a team that is already there is refused.
export async function addTeamToLeague(leagueId: number, teamId: number): Promise<void> {
  if (teamId === BYE_TEAM_ID) throw new InvalidResultError("The bye team can't be added.");
  try {
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: teamId}});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new InvalidResultError("The team is already in this league.");
      if (error.code === "P2003") throw new InvalidResultError("The team doesn't exist.");
    }
    throw error;
  }
}

// Marks a team of a league active or inactive. Returns false when the team is not in the league.
export async function setLeagueTeamActive(leagueId: number, teamId: number, active: boolean): Promise<boolean> {
  const {count} = await prisma.leagueTeam.updateMany({where: {league_id: leagueId, team_id: teamId}, data: {active}});
  return count > 0;
}
