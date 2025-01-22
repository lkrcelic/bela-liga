import {prisma} from "@/app/lib/prisma";
import {Prisma} from "@prisma/client";

export async function getNewestOngoingMatchByRoundId(roundId: number): Promise<unknown> {
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