import {getBelaResultWithAnnouncements} from "@/app/_lib/service/ongoingBelaResult/getOneWithAnnouncements";
import {BelaResultCreateRequestValidation, BelaResultResponseValidation} from "@/app/_interfaces/belaResult";
import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {updateOngoingBelaResult} from "@/app/_lib/service/ongoingBelaResult/update";
import {canPlayRound, notYourRoundResponse, requireUser} from "@/app/_lib/service/auth/requireUser";
import {getRoundIdOfOngoingResult} from "@/app/_lib/service/ongoingMatch/getRoundId";
import {errorResponse} from "@/app/_lib/apiErrors";

export async function GET(request: NextRequest, {params}: { params: { id: string } }): Promise<Response> {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const {id} = params;

    try {
        const dbOngoingBelaResult = await getBelaResultWithAnnouncements(Number(id));
        if (!dbOngoingBelaResult) {
            return NextResponse.json({error: "Hand not found."}, {status: STATUS.NotFound});
        }

        const ongoingBelaResult = BelaResultResponseValidation.parse(dbOngoingBelaResult);

        return NextResponse.json(ongoingBelaResult, {status: STATUS.OK});
    } catch (error) {
        return errorResponse(error, "Failed to fetch ongoing bela result.");
    }
}

export async function PUT(request: NextRequest, {params}: { params: { id: string } }): Promise<NextResponse> {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const resultId = Number(params.id);

    try {
        const req_data = await request.json();
        const resultData = BelaResultCreateRequestValidation.parse(req_data);

        if (!(await canPlayRound(auth.user, await getRoundIdOfOngoingResult(resultId)))) {
            return notYourRoundResponse();
        }

        await updateOngoingBelaResult({result_id: resultId, resultData: resultData});

        return NextResponse.json({message: "Result successfully updated"}, {status: STATUS.OK});
    } catch (error) {
        return errorResponse(error, "Failed to update the hand.");
    }
}
