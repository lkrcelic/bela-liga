import {prisma} from "@/app/_lib/prisma";
import {Team} from "@prisma/client";
import {TeamCreateRequest} from "@/app/_interfaces/team";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import {teamNameTaken} from "./update";

// Creates a team with its players and adds it to the league, so it can be picked for rounds.
// The first two players are recorded as its founders; a team may start without players and get them later.
export async function createTeam(request: TeamCreateRequest, creatorId: number): Promise<Team> {
  if (await teamNameTaken(request.team_name)) {
    throw new InvalidResultError("A team with this name already exists.");
  }

  const found = await prisma.player.count({where: {id: {in: request.players}}});
  if (found !== request.players.length) {
    throw new InvalidResultError("Every player must be an existing player.");
  }

  return prisma.team.create({
    data: {
      team_name: request.team_name,
      founder_id1: request.players[0] ?? null,
      founder_id2: request.players[1] ?? null,
      creator_id: creatorId,
      teamPlayers: {
        create: request.players.map((player_id) => ({player_id})),
      },
      leagueTeams: {
        create: {league_id: request.league_id ?? CURRENT_LEAGUE_ID},
      },
    },
  });
}
