import {prisma} from "@/app/_lib/prisma";
import {OngoingMatch} from "@prisma/client";
import {CreateOngoingMatchRequest} from "@/app/_interfaces/match";

export async function createOngoingMatch(createRequest: CreateOngoingMatchRequest): Promise<OngoingMatch> {
    const round = await prisma.round.findUnique({
        where: {id: createRequest.round_id},
    });
    if (!round) {
        throw new Error("Round not found");
    }

    // Starting a game is a single tap now, so several players may start it at once - reuse the running match.
    const existingOngoingMatch = await prisma.ongoingMatch.findFirst({
        where: {round_id: createRequest.round_id},
    });
    if (existingOngoingMatch) {
        return existingOngoingMatch;
    }

    const ongoingMatch = await prisma.ongoingMatch.create({data: createRequest});

    await prisma.round.update({
        where: {id: createRequest.round_id},
        data: {active: true},
    });

    return ongoingMatch;
}
