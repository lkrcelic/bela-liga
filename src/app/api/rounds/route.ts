import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {matchTeams} from "@/app/lib/matching/matching";
import {getLeagueTeamsWithScores} from "@/app/lib/helpers/query/leagueScores";
import {CreateRound} from "@/app/lib/interfaces/round";

export async function GET(request: Request) {
  try {
    let teamData = await getLeagueTeamsWithScores(1);
    let pairs = matchTeams(teamData);

    return NextResponse.json(pairs, {status: STATUS.OK});
  } catch (error) {
    console.error("Error fetching round:", error);
    return NextResponse.json({error: "Failed to fetch."}, {status: STATUS.BadRequest});
  }
}

export async function POST(request: Request) {
  try {
    const req_data = await request.json();
    let parsedRequest = CreateRound.parse(req_data);

    let teamData = await getLeagueTeamsWithScores(parsedRequest.league_id);
    if (!teamData || teamData.length === 0) return NextResponse.json("Invalid league id.", {status: STATUS.BadRequest});

    // filter out teams that are not present
    let filteredTeams = teamData.filter((team) => parsedRequest.present_teams.includes(team.id));
    const pairs = matchTeams(filteredTeams);

    return NextResponse.json(pairs, {status: STATUS.OK});
  } catch (error) {
    console.error("Error fetching round:", error);
    return NextResponse.json({error: "Failed to fetch round."}, {status: STATUS.BadRequest});
  }
}
