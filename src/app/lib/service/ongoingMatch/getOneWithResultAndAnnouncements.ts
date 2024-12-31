import {prisma} from "@/app/lib/prisma";

export async function getOngoingMatchWithResultsAndAnnouncements(ongoingMatchId: number): Promise<any> {
    return prisma.ongoingMatch.findUnique({
        where: {id: ongoingMatchId},
        include: {belaResults: {include: {belaPlayerAnnouncements: true}}}
    });
}