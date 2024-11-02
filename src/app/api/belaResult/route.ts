// src/app/api/belaResult/route.ts

import {prisma} from "@/app/lib/prisma";
import {BelaResultValidationRequestValidation} from "@/app/interfaces/belaResult";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {belaResultIsValid} from "@/app/lib/validation/validateResult";
import {updateMatch} from "@/app/lib/service/match/update";
import {createBelaResult} from "@/app/lib/service/belaResult/create";

export async function GET() {
    try {
        // TODO: check user!
        // TODO?: implement limit/offset
        const allResults = await prisma.belaResult.findMany();

        return NextResponse.json(allResults, {status: STATUS.OK});
    } catch (error) {
        return NextResponse.json({error: "Failed to fetch results."}, {status: STATUS.ServerError});
    }
}

export async function POST(request: Request) {
    try {
        const req_data = await request.json();
        const resultData = BelaResultValidationRequestValidation.parse(req_data);

        await createBelaResult(resultData);
        await updateMatch(resultData);

        return NextResponse.json({message: "Result successfully created"},{status: STATUS.OK});
    } catch (error) {
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}
