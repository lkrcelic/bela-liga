import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {TournamentRequest, TournamentRequestValidation} from "@/app/_interfaces/tournament";
import {createTournament, listAdminTournaments} from "@/app/_lib/service/tournament/tournaments";

export const dynamic = "force-dynamic";

// Every tournament for the admin's Turniri list (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  try {
    return NextResponse.json(await listAdminTournaments(auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Turniri se nisu učitali.");
  }
}

// Novi turnir (admin): published at once, sign-ups open
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  try {
    const body = TournamentRequestValidation.parse(await request.json()) as TournamentRequest;
    return NextResponse.json({id: await createTournament(body)}, {status: STATUS.Created});
  } catch (error) {
    return errorResponse(error, "Turnir nije kreiran.");
  }
}
