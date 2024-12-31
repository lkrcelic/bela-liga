import {NextRequest, NextResponse} from "next/server";
import {getAuthorizedUser} from "@/app/lib/auth";
import {STATUS} from "@/app/lib/statusCodes";
import {getAllTeamScores} from "@/app/lib/service/teamScores/getAll";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return NextResponse.json({message: "You are not authorized for this action."}, {status: STATUS.NotAllowed});
    }

    const teamScores = await getAllTeamScores();

    return NextResponse.json(teamScores, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch players."}, {status: STATUS.ServerError});
  }
}
