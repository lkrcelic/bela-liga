// src/app/api/belaResult/route.ts

import {prisma} from "@/app/lib/prisma";
import {z} from "zod";
import {BelaResultValidationRequestValidation} from "@/app/lib/interfaces/belaResult";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {belaResultIsValid} from "@/app/lib/belaValidation/validateResult";

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

        const announcements = await prisma.ongoingBelaPlayerAnnouncement.findMany({
            where: {
                result_id: result.result_id
            }
        });

        return NextResponse.json({
            "result": result,
            "announcements": announcements,
            "matchOver": match_over
        }, {status: STATUS.OK});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
        }
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}
