import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {errorResponse} from "@/app/_lib/apiErrors";
import {requireAdmin} from "@/app/_lib/service/auth/requireUser";
import {addKolo, deleteKolo} from "@/app/_lib/service/tournament/kola";
import {getAdminTournament} from "@/app/_lib/service/tournament/tournaments";
import {tournamentIdOf, tournamentNotFound} from "@/app/_lib/service/tournament/routes";

// Dodaj kolo (admin): the tournament gets Kolo n, one more than it had
export async function PUT(request: NextRequest, {params}: {params: {id: string; n: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await addKolo(id, Number(params.n));
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Kolo nije dodano.");
  }
}

// Obriši kolo (admin): the tournament's last Kolo n goes; one already played at only with ?rezultati=1 (the admin saw
// the warning that its results go too)
export async function DELETE(request: NextRequest, {params}: {params: {id: string; n: string}}) {
  const auth = await requireAdmin(request);
  if (auth.response) return auth.response;
  const id = tournamentIdOf(params.id);
  if (id == null) return tournamentNotFound();
  try {
    await deleteKolo(id, Number(params.n), {withResults: request.nextUrl.searchParams.get("rezultati") === "1"});
    return NextResponse.json(await getAdminTournament(id, auth.user), {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Kolo nije obrisano.");
  }
}
