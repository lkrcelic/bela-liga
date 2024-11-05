// src/app/api/ongoing-bela-result/route.ts

import {BelaResultCreateRequestValidation} from "@/app/interfaces/belaResult";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {incrementOngoingMatchScore} from "@/app/lib/service/ongoingMatch/update";
import {createBelaResult} from "@/app/lib/service/ongoingBelaResult/create";


export async function POST(request: Request) {
    try {
        const req_data = await request.json();
        const resultData = BelaResultCreateRequestValidation.parse(req_data);

        await createBelaResult(resultData);
        await incrementOngoingMatchScore(resultData);

        return NextResponse.json({message: "Result successfully created"},{status: STATUS.OK});
    } catch (error) {
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}
