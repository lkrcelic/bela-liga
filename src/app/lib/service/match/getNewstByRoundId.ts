import {prisma} from "@/app/lib/prisma";
import {OngoingMatch, Prisma} from "@prisma/client";

export async function getNewestOngoingMatchByRoundId(roundId: number): Promise<OngoingMatch> {
  const ongoingMatch =  await prisma.ongoingMatch.findFirst({
    where: {
      round_id: roundId,
    },
    orderBy: {
      start_time: 'asc',
    },
    select: {
      id: true,
      start_time: true,
    },
  } as Prisma.OngoingMatchFindUniqueArgs);

  return ongoingMatch;
}