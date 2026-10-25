import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {getAuthorizedUser} from "@/app/_lib/service/auth/getAuthorizedUser";
import {listTournaments} from "@/app/_lib/service/tournament/tournaments";
import {NO_STORE} from "@/app/_lib/service/tournament/routes";

export const dynamic = "force-dynamic";

// Public; the tournaments for Početna · Turniri and the lists (upcoming, live, finished, cancelled), with the viewer's
// own team when someone is logged in
export async function GET(request: NextRequest) {
  try {
    const viewer = await getAuthorizedUser(request);
    return NextResponse.json(await listTournaments(viewer), {status: STATUS.OK, headers: NO_STORE});
  } catch (error) {
    return errorResponse(error, "Turniri se nisu učitali.");
  }
}
