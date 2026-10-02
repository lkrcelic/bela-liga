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

        if (!(await canPlayRound(auth.user, await getRoundIdOfOngoingMatch(resultData.match_id)))) {
            return notYourRoundResponse();
        }

        await createBelaResult(resultData);

        return NextResponse.json({message: "Result successfully created"}, {status: STATUS.OK});
    } catch (error) {
        return errorResponse(error, "Failed to save the hand.");
    }
}
