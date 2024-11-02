import {prisma} from "@/app/lib/prisma";
import {transformBelaMatch} from "@/app/lib/helpers/databaseHelpers";
import {Match, OngoingMatch} from "@prisma/client";

export async function createMatch(ongoingMatch: any): Promise<Match> {
  const ongoingMatchNested = transformBelaMatch(ongoingMatch);
  return prisma.match.create({data: ongoingMatchNested});
}
