// src/app/api/matches/route.ts

import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";

export async function GET() {
    try {
        // TODO: check user!
        // TODO?: implement limit/offset
        const allMatches = await prisma.match.findMany();

        return NextResponse.json(allMatches, {status: STATUS.OK});
    } catch (error) {
        return NextResponse.json({error: "Failed to fetch matches."}, {status: STATUS.ServerError});
    }
}

