import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {cancelTournament, getAdminTournament, restoreTournament} from "@/app/_lib/service/tournament/tournaments";
import {tournamentIdOf, tournamentNotFound} from "@/app/_lib/service/tournament/routes";

// Otkaži turnir (admin): it stays in the lists as Otkazan, before it starts
export async function POST(request: NextRequest, {params}: {params: {id: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await cancelTournament(id, auth.user.id);
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Turnir nije otkazan.");
  }
}

// Vrati turnir (admin): a cancelled tournament is back, with its sign-ups open
export async function DELETE(request: NextRequest, {params}: {params: {id: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await restoreTournament(id);
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Turnir nije vraćen.");
  }
}
