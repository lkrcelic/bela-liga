import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {generateMultipleRoundPairings, TeamPair} from "@/app/_lib/matching/multipleRoundMatching";
import {getLeagueTeamsWithScores} from "@/app/_lib/helpers/query/leagueScores";
import {RoundCreateRequestValidation} from "@/app/_interfaces/round";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {insertRoundBatch} from "@/app/_lib/service/round/insertPairRounds";
import {errorResponse} from "@/app/_lib/apiErrors";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const parsed = RoundCreateRequestValidation.parse(body);
    const {league_id, present_teams} = parsed;
    const numberOfRounds = parsed.numberOfRounds ?? 3;
    const windowSize = parsed.windowSize ?? 8;

    const teamsWithScores = await getLeagueTeamsWithScores(league_id);
    const filteredTeams = teamsWithScores.filter((team) => present_teams.includes(team.id));

    let allRoundPairings: TeamPair[][];
    try {
      allRoundPairings = generateMultipleRoundPairings(filteredTeams, {windowSize, numberOfRounds});
    } catch (error) {
      // the pairing rejects impossible settings (odd window, more rounds than teams, ...)
      return NextResponse.json({error: (error as Error).message}, {status: STATUS.BadRequest});
    }

    const {firstRoundNumber, alreadyCreated} = await insertRoundBatch(allRoundPairings, league_id);

    return NextResponse.json(
      {round_number: firstRoundNumber, already_created: alreadyCreated},
      {status: alreadyCreated ? STATUS.OK : STATUS.Created}
    );
  } catch (error) {
    return errorResponse(error, "Failed to create rounds.");
  }
}
