import { NextRequest, NextResponse } from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import { getRoundDatesByLeagueId } from "@/app/_lib/service/league/getRoundDatesById";

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
    const {id} = params;
    
    try {
        const dates = await getRoundDatesByLeagueId(Number(id));

        return NextResponse.json(dates, {status: STATUS.OK});
      } catch (error) {
        console.log(error);
        return NextResponse.json({error: "Failed to fetch round dates."}, {status: STATUS.ServerError});
      }
    
}