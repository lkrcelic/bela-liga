import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getLastOpenRoundByPlayerId, OpenRoundScope} from "@/app/_lib/service/round/getLastOpenByPlayerId";
import {getNewestOngoingMatchByRoundId} from "@/app/_lib/service/match/getNewstByRoundId";
import {requireUser} from "@/app/_lib/service/auth/requireUser";
import {hasLineup} from "@/app/_lib/service/round/lineup";
import {tableNightKolo} from "@/app/_lib/service/round/nightKolo";

const SCOPES: OpenRoundScope[] = ["league", "tournament", "any"];

// The round the logged-in player should play now, and its running match if one is started (with its score, team1
// first, for the Continue Game card on Home). hasLineup: who plays it is confirmed, so Start Game can skip that step.
// ?scope=league or tournament: only a league's table (Početna · Liga) or a tournament's (Početna · Turniri).
// nightKolo: for a league's table, which of its place's published Kola tonight it is ("Kolo 1/3"); null for a
// tournament's.
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  try {
    const asked = request.nextUrl.searchParams.get("scope") as OpenRoundScope | null;
    const scope = asked && SCOPES.includes(asked) ? asked : "any";
    const round = await getLastOpenRoundByPlayerId(auth.user.id, scope);
    if (!round) {
      return NextResponse.json({error: "Trenutno nemaš otvorenu rundu."}, {status: STATUS.NotFound});
    }

    const [ongoingMatch, lineup, kola] = await Promise.all([
      getNewestOngoingMatchByRoundId(round.id),
      hasLineup(round.id),
      round.tournament_id == null
        ? tableNightKolo({id: round.id, round_number: round.round_number ?? null, round_date: round.round_date ?? null, location_slot: round.location_slot ?? null})
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      roundId: round.id,
      ongoingMatchId: ongoingMatch?.id || null,
      hasLineup: lineup,
      ongoingScore: ongoingMatch ? [ongoingMatch.player_pair1_score ?? 0, ongoingMatch.player_pair2_score ?? 0] : null,
      tournamentId: round.tournament_id ?? null,
      nightKolo: kola,
    }, {status: STATUS.OK});
  } catch (error) {
    console.error(error);
    return NextResponse.json({error: "Otvorena runda se nije učitala."}, {status: STATUS.ServerError});
  }
}

