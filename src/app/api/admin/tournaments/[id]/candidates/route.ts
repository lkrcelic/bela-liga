import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {candidateTeams} from "@/app/_lib/service/tournament/entries";
import {tournamentIdOf, tournamentNotFound} from "@/app/_lib/service/tournament/routes";

export const dynamic = "force-dynamic";

// Dodaj ekipu's search (admin): teams not signed up yet, by name or a player's name or username
export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    return NextResponse.json(await candidateTeams(id, request.nextUrl.searchParams.get("q") ?? ""), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Ekipe se nisu učitale.");
  }
}
