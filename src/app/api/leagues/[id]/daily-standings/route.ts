import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getLeagueStandingsByDate} from "@/app/_lib/service/league/getStandingsByDate";
import {leagueDateString} from "@/app/_lib/dates";

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
  const {id} = params;
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');
  
  // A YYYY-MM-DD date is used as is, without the date shifting through time zones
  const currentDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : leagueDateString();

  try {
    const teamScores = await getLeagueStandingsByDate(Number(id), currentDate);

    return NextResponse.json(teamScores, {status: STATUS.OK});
  } catch (error) {
    console.log(error);
    return NextResponse.json({error: "Failed to fetch league standings."}, {status: STATUS.ServerError});
  }
}
