import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {TournamentRequest, TournamentRequestValidation} from "@/app/_interfaces/tournament";
import {deleteTournament, getAdminTournament, updateTournament} from "@/app/_lib/service/tournament/tournaments";
import {ensureNextKoloDraft} from "@/app/_lib/service/tournament/kola";
import {tournamentIdOf, tournamentNotFound} from "@/app/_lib/service/tournament/routes";

export const dynamic = "force-dynamic";

type Params = {params: {id: string}};

// Upravljanje turnirom (admin): the tournament, its entries, waiting list, Kolos (the draft too) and standings. Once
// the last Kolo out is played to the end, the next one's draft is made here if it wasn't yet.
export async function GET(request: NextRequest, {params}: Params) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await ensureNextKoloDraft(id);
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Turnir se nije učitao.");
  }
}

// Podaci · Spremi promjene (admin): the whole form
export async function PATCH(request: NextRequest, {params}: Params) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await updateTournament(id, TournamentRequestValidation.parse(await request.json()) as TournamentRequest);
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Promjene nisu spremljene.");
  }
}

// Obriši turnir (admin), only before it starts
export async function DELETE(request: NextRequest, {params}: Params) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await deleteTournament(id);
    return new NextResponse(null, {status: STATUS.NoContent});
  } catch (error) {
    return errorResponse(error, "Turnir nije obrisan.");
  }
}
