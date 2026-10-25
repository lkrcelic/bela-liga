import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {signOff} from "@/app/_lib/service/tournament/entries";
import {getAdminTournament} from "@/app/_lib/service/tournament/tournaments";
import {tournamentIdOf, tournamentNotFound} from "@/app/_lib/service/tournament/routes";

// Makni ekipu (admin), without a notice; the first team waiting comes in
export async function DELETE(request: NextRequest, {params}: {params: {id: string; teamId: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await signOff(id, Number(params.teamId), auth.user);
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Ekipa nije maknuta.");
  }
}
