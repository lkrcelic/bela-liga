import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getLeagueStandingsWithMovement} from "@/app/_lib/service/league/getStandings";
import {isDbId} from "@/app/_lib/helpers/query/dbId";
import {requireUser} from "@/app/_lib/service/auth/requireUser";
import {teamPhotoUrls} from "@/app/_lib/service/players/photos";

// Ukupni poredak: {standings, showMovement, movementSince}, every row with its +/− since the league's previous night
// (see getLeagueStandingsWithMovement), and each team's photo_url (the photos the viewer may see). Needs a login: a
// guest sees the league locked ("Gost i poziv", DECISIONS #75).
export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const leagueId = Number(params.id);
  // an id the database can't hold (also a malformed one) doesn't exist either
  if (!isDbId(leagueId)) return NextResponse.json({error: "Liga ne postoji."}, {status: STATUS.NotFound});

  try {
    const standings = await getLeagueStandingsWithMovement(leagueId);
    const photos = await teamPhotoUrls(auth.user, standings.standings.map((s) => s.team_id));

    return NextResponse.json(
      {...standings, standings: standings.standings.map((s) => ({...s, photo_url: photos.get(s.team_id) ?? null}))},
      {status: STATUS.OK, headers: {"Cache-Control": "private, no-store"}}
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({error: "Poredak se nije učitao."}, {status: STATUS.ServerError});
  }
}
