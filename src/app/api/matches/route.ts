// src/app/api/matches/route.ts

import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {MatchRequestValidation} from "@/app/lib/interfaces/match";
import {z} from "zod";
import {transformBelaMatch} from "@/app/lib/apiHelpers/databaseHelpers";
import {updateRoundWins} from "@/app/lib/apiHelpers/updateRoundWins";

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

export async function POST(request: Request) {
    const req_data = await request.json();
    const ongoingMatchId = MatchRequestValidation.parse(req_data);

    try {
        const dbOngoingMatch = await prisma.ongoingMatch.findUnique({
            where: {id: ongoingMatchId},
            include: {belaResults: {include: {belaPlayerAnnouncements: true}}}
        });

        if (!dbOngoingMatch)
            throw new Error("Something went wrong no ongoing match with that id");

        const ongoingMatchNested = transformBelaMatch(dbOngoingMatch);
        const matchPersisted = await prisma.match.create({data: ongoingMatchNested});

        await prisma.ongoingMatch.delete({where: {id: ongoingMatchId}});

        await updateRoundWins(ongoingMatchNested.round_id!, ongoingMatchNested.player_pair1_score,ongoingMatchNested.player_pair2_score)

        return NextResponse.json({"match": matchPersisted,}, {status: STATUS.OK});

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
        }
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}
