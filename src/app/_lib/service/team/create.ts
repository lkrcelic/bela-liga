import {prisma} from "@/app/_lib/prisma";
import {Team} from "@prisma/client";
import {z} from "zod";
import {TeamRequestValidation} from "@/app/_interfaces/team";
import {CURRENT_LEAGUE_ID} from "@/app/_lib/league";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";

// Creates a team with its two founders as players and adds it to the league, so it can be picked for rounds.
export async function createTeam(createRequest: z.infer<typeof TeamRequestValidation>, creatorId: number): Promise<Team> {
  if (createRequest.founder_id1 === createRequest.founder_id2) {
    throw new InvalidResultError("A team needs two different players.");
  }

  return prisma.team.create({
    data: {
      team_name: createRequest.team_name,
      founder_id1: createRequest.founder_id1,
      founder_id2: createRequest.founder_id2,
      creator_id: creatorId,
      teamPlayers: {
        create: [
          {player_id: createRequest.founder_id1},
          {player_id: createRequest.founder_id2},
        ],
      },
      leagueTeams: {
        create: {league_id: createRequest.league_id ?? CURRENT_LEAGUE_ID},
      },
    },
  });
}
