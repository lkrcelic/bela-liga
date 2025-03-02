import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getLeagueStandingsByDate} from "@/app/_lib/service/league/getStandingsByDate";

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
  const {id} = params;

  try {
    const teamScores = await getLeagueStandingsByDate(Number(id), "2025-03-02");

    return NextResponse.json(teamScores, {status: STATUS.OK});
  } catch (error) {
    console.log(error);
    return NextResponse.json({error: "Failed to fetch league standings."}, {status: STATUS.ServerError});
  }
}
