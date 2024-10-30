// src/app/api/belaResult/route.ts

import {prisma} from "@/app/lib/prisma";
import {z} from "zod";
import {BelaResultValidationRequestValidation} from "@/app/lib/interfaces/belaResult";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {belaResultIsValid} from "@/app/lib/belaValidation/validateResult";
import {transformBelaResult} from "@/app/lib/helpers/databaseHelpers";
import {updateMatch} from "@/app/lib/belaValidation/updateMatch";

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

        if (!belaResultIsValid(resultData)) {
            return NextResponse.json({error: "Invalid bela result entry."}, {status: STATUS.BadRequest});
        }

        // TODO: Validate one of the 4 players playing the game is entering the result?

        await updateMatch(resultData)

        const createNested = transformBelaResult(resultData); // TODO DO I NEED THIS
        const result = await prisma.ongoingBelaResult.create({data: createNested});


        return NextResponse.json({"result": result}, {status: STATUS.OK});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
        }
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}
