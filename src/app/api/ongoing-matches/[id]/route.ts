import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getOngoingMatchWithResults} from "@/app/_lib/service/ongoingMatch/getOneWithResults";
import {canPlayRound, notYourRoundResponse, requireUser} from "@/app/_lib/service/auth/requireUser";
import {lookupErrorResponse} from "@/app/_lib/apiErrors";

export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const {id} = params;

    try {
        const ongoingMatch = await getOngoingMatchWithResults(Number(id));
        // the match and its hands go only to who may play the table, as Spremi and Tko igra already require: its two
        // teams' players and whoever runs it (the admin, the organizer at their own tournament's tables) (#88)
        if (!(await canPlayRound(auth.user, ongoingMatch.round_id))) return notYourRoundResponse();

        return NextResponse.json(ongoingMatch, {status: STATUS.OK});
    } catch (error) {
        // a finished match is gone (NotFoundError → 404, not logged), which phones following it check for regularly
        return lookupErrorResponse(error, "Meč se nije učitao.");
    }
}
