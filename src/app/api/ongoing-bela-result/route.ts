import {BelaResultCreateRequestValidation} from "@/app/_interfaces/belaResult";
import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {createBelaResult} from "@/app/_lib/service/ongoingBelaResult/create";
import {canPlayRound, notYourRoundResponse, requireUser} from "@/app/_lib/service/auth/requireUser";
import {getRoundIdOfOngoingMatch} from "@/app/_lib/service/ongoingMatch/getRoundId";
import {errorResponse} from "@/app/_lib/apiErrors";

export async function POST(request: NextRequest) {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;

    try {
        const req_data = await request.json();
        const resultData = BelaResultCreateRequestValidation.parse(req_data);
        // when the player opened the hand's entry (Vrijeme partije: a hand started before the time was up is still taken)
        const started = typeof req_data?.entry_started_at === "string" ? new Date(req_data.entry_started_at) : null;
        const entryStartedAt = started && !Number.isNaN(started.getTime()) ? started : null;

        if (!(await canPlayRound(auth.user, await getRoundIdOfOngoingMatch(resultData.match_id)))) {
            return notYourRoundResponse();
        }

        const {closed} = await createBelaResult(resultData, undefined, {entryStartedAt});

        return NextResponse.json({message: "Igra je spremljena.", closed}, {status: STATUS.OK});
    } catch (error) {
        return errorResponse(error, "Igra nije spremljena.");
    }
}
